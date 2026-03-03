from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.api import deps
from app.core import database
from app.models.models import Product, User, Inventory, ProductRecipe, UserRole, RawMaterial, ProductCustomization
from app.schemas.schemas import ProductCreate, ProductResponse, CustomizationCreate, CustomizationResponse

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
async def read_products(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(Product).options(
        joinedload(Product.inventory),
        joinedload(Product.recipe_items).joinedload(ProductRecipe.raw_material),
        joinedload(Product.customizations).joinedload(ProductCustomization.raw_material)
    )
    
    # Branch Isolation
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(Product.branch_id == current_user.branch_id)
    
    products = query.offset(skip).limit(limit).all()
    
    result = []
    for p in products:
        # Pydantic will handle most fields, but we need to compute stock and recipe list
        # However, if we return the list of products directly, Pydantic's from_attributes
        # needs the attributes to exist on the object.
        
        p.stock = p.inventory.quantity if p.inventory else 0
        
        # Inject formatted recipe items for Pydantic to pick up from attributes
        # We can't easily add to p.recipe_items as it's a SA collection.
        # Let's create a list of dicts that match RecipeItemResponse
        
        formatted_recipes = []
        for item in p.recipe_items:
            formatted_recipes.append({
                "raw_material_id": item.raw_material_id,
                "raw_material_name": item.raw_material.name,
                "quantity": item.quantity,
                "unit": item.raw_material.unit
            })
        
        formatted_customizations = []
        for cust in p.customizations:
            formatted_customizations.append({
                "id": cust.id,
                "name": cust.name,
                "extra_price": cust.extra_price,
                "raw_material_id": cust.raw_material_id,
                "raw_material_name": cust.raw_material.name if cust.raw_material else None,
                "quantity": cust.quantity
            })
        
        # Using a custom return object per product to be safe
        prod_res = {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "stock": p.stock,
            "recipe_items": formatted_recipes,
            "customizations": formatted_customizations
        }
        result.append(prod_res)
    
    return result

@router.get("/public/{branch_id}", response_model=List[ProductResponse])
async def read_public_products(
    branch_id: int,
    db: Session = Depends(database.get_db)
):
    """
    Publicly accessible endpoint to get products for a specific branch.
    """
    products = db.query(Product).options(
        joinedload(Product.inventory)
    ).filter(Product.branch_id == branch_id).all()
    
    result = []
    for p in products:
        p.stock = p.inventory.quantity if p.inventory else 0
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "stock": p.stock,
            "recipe_items": [] # Don't expose recipes publicly
        })
    return result

@router.post("/", response_model=ProductResponse)
async def create_product(
    product_in: ProductCreate, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_manager)
):
    # Check for duplicate name
    existing = db.query(Product).filter(Product.name.ilike(product_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"A product with the name '{product_in.name}' already exists.")

    product_data = product_in.dict(exclude={"recipe_items", "customizations"})
    
    # Assign branch
    if not product_data.get("branch_id") or current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        product_data["branch_id"] = current_user.branch_id
        
    if not product_data["branch_id"]:
         raise HTTPException(status_code=400, detail="Branch ID is required for product creation")

    db_product = Product(**product_data)
    db.add(db_product)
    db.flush() # Get ID
    
    # Initialize inventory
    db_inventory = Inventory(product_id=db_product.id, quantity=0, branch_id=db_product.branch_id)
    db.add(db_inventory)
    
    # Handle recipes
    if product_in.recipe_items:
        for item in product_in.recipe_items:
            recipe_entry = ProductRecipe(
                product_id=db_product.id,
                raw_material_id=item.raw_material_id,
                quantity=item.quantity
            )
            db.add(recipe_entry)

    # Handle customizations
    if product_in.customizations:
        for cust in product_in.customizations:
            cust_entry = ProductCustomization(
                product_id=db_product.id,
                **cust.dict()
            )
            db.add(cust_entry)
    
    db.commit()
    db.refresh(db_product)
    
    # Re-fetch with joined relations to ensure raw materials are loaded for the response
    db_product = db.query(Product).options(
        joinedload(Product.inventory),
        joinedload(Product.recipe_items).joinedload(ProductRecipe.raw_material)
    ).filter(Product.id == db_product.id).first()
    
    formatted_recipes = []
    for item in db_product.recipe_items:
        formatted_recipes.append({
            "raw_material_id": item.raw_material_id,
            "raw_material_name": item.raw_material.name,
            "quantity": item.quantity,
            "unit": item.raw_material.unit
        })

    return {
        "id": db_product.id,
        "name": db_product.name,
        "description": db_product.description,
        "price": db_product.price,
        "category": db_product.category,
        "stock": db_product.inventory.quantity if db_product.inventory else 0,
        "recipe_items": formatted_recipes
    }

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    id: int, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_manager)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check branch access
    deps.check_branch_access(current_user, product.branch_id)
    
    # Delete inventory first (or use cascade in models)
    # db.query(Inventory).filter(Inventory.product_id == id).delete()
    db.delete(product)
    db.commit()
    return


@router.post("/{product_id}/customizations", response_model=CustomizationResponse)
async def add_customization(
    product_id: int,
    cust_in: CustomizationCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    deps.check_branch_access(current_user, product.branch_id)
    
    db_cust = ProductCustomization(product_id=product_id, **cust_in.dict())
    db.add(db_cust)
    db.commit()
    db.refresh(db_cust)
    
    # Manually attach name if raw_material exists for the response
    if db_cust.raw_material_id:
        rm = db.query(RawMaterial).filter(RawMaterial.id == db_cust.raw_material_id).first()
        db_cust.raw_material_name = rm.name if rm else None
    else:
        db_cust.raw_material_name = None

    return db_cust

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_user
from models import Product, StockMovement, User
from schemas import ProductCreate, ProductUpdate, ProductResponse, StockMovementCreate, StockMovementResponse

router = APIRouter(tags=["inventory"])


@router.get("/products", response_model=list[ProductResponse])
async def list_products(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Product).where(Product.is_active == True).order_by(Product.name))
    return result.scalars().all()


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(body: ProductCreate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    product = Product(**body.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: UUID, body: ProductUpdate, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/stock-movements", response_model=list[StockMovementResponse])
async def list_movements(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(StockMovement).order_by(StockMovement.created_at.desc()))
    return result.scalars().all()


@router.post("/stock-movements", response_model=StockMovementResponse, status_code=201)
async def create_movement(
    body: StockMovementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product_result = await db.execute(select(Product).where(Product.id == body.product_id))
    product = product_result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movement = StockMovement(**body.model_dump(), created_by=current_user.id)
    if body.type == "in":
        product.stock_quantity += body.quantity
    elif body.type == "out":
        product.stock_quantity -= body.quantity
    elif body.type == "adjustment":
        product.stock_quantity = body.quantity

    db.add(movement)
    await db.commit()
    await db.refresh(movement)
    return movement

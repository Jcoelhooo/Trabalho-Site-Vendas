import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface ProductAttributes {
  id: number;
  sku: string;
  name: string;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public sku!: string;
  public name!: string;
  public stock!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
  }
);

// Seed function
export async function seedProductsIfEmpty(): Promise<void> {
  const count = await Product.count();
  if (count === 0) {
    await Product.bulkCreate([
      { sku: 'CASE-IPHN', name: 'Capinha para iPhone', stock: 15 },
      { sku: 'IPHN-15-BLK', name: 'iPhone 15 Preto 128GB', stock: 12 },
      { sku: 'IPHN-15-PNK', name: 'iPhone 15 Rosa 128GB', stock: 7 },
      { sku: 'AIRP-3RD', name: 'AirPods (3ª geração)', stock: 20 },
      { sku: 'APWT-S9', name: 'Apple Watch Series 9', stock: 9 },
      { sku: 'MGSF-15W', name: 'Carregador MagSafe 15W', stock: 30 },
    ]);
    console.log('✅ Produtos seed criados.');
  }
}






import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';

const dbDir = path.resolve(process.cwd(), 'data');
fs.mkdirSync(dbDir, { recursive: true });

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dbDir, 'data.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export async function connectDatabase(): Promise<void> {
  try {
    // Importa os modelos para garantir que sejam registrados
    await import('../models/Product.js');
    await import('../models/User.js');
    
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida.');
    
    // Verifica se as tabelas existem
    const [results] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('products', 'users')"
    ) as [Array<{name: string}>, unknown];
    
    const tablesExist = results.length > 0;
    
    if (!tablesExist) {
      // Primeira vez: cria as tabelas
      await sequelize.sync({ force: true });
      console.log('✅ Tabelas criadas.');
    } else {
      // Tabelas já existem: tenta sincronizar sem forçar
      try {
        await sequelize.sync({ alter: false });
        console.log('✅ Modelos sincronizados com o banco de dados.');
      } catch (syncError) {
        // Se falhar, recria as tabelas (dados serão perdidos)
        console.warn('⚠️ Erro ao sincronizar, recriando tabelas...');
        await sequelize.sync({ force: true });
        console.log('✅ Tabelas recriadas.');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}


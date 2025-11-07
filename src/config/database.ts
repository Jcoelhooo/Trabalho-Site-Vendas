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
      console.log('📝 Criando tabelas pela primeira vez...');
      await sequelize.sync({ force: true });
      console.log('✅ Tabelas criadas.');
    } else {
      // Tabelas já existem: verifica se a estrutura está compatível
      try {
        // Verifica se a tabela users tem a coluna 'login'
        const [columns] = await sequelize.query(
          "PRAGMA table_info(users)"
        ) as [Array<{name: string, type: string}>, unknown];
        
        const hasLoginColumn = columns.some((col: {name: string}) => col.name === 'login');
        const hasEmailColumn = columns.some((col: {name: string}) => col.name === 'email');
        
        if (!hasLoginColumn) {
          console.warn('⚠️ Estrutura do banco desatualizada (falta coluna "login"). Recriando tabelas...');
          await sequelize.sync({ force: true });
          console.log('✅ Tabelas recriadas com estrutura atualizada.');
        } else {
          // Estrutura parece compatível, tenta sincronizar
          try {
            await sequelize.sync({ alter: true });
            console.log('✅ Modelos sincronizados com o banco de dados.');
          } catch (syncError: any) {
            // Se falhar, recria as tabelas (dados serão perdidos)
            console.warn('⚠️ Erro ao sincronizar estrutura:', syncError.message);
            console.warn('⚠️ Recriando tabelas com estrutura atualizada...');
            await sequelize.sync({ force: true });
            console.log('✅ Tabelas recriadas.');
          }
        }
      } catch (checkError: any) {
        // Se houver erro ao verificar, recria tudo
        console.warn('⚠️ Erro ao verificar estrutura do banco:', checkError.message);
        console.warn('⚠️ Recriando tabelas...');
        await sequelize.sync({ force: true });
        console.log('✅ Tabelas recriadas.');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}


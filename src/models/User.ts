import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';

export interface UserAttributes {
  id: number;
  login: string;
  email?: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  // NÃO declarar campos públicos aqui - isso interfere com os getters/setters do Sequelize
  // Os atributos são definidos apenas via User.init() abaixo

  public async comparePassword(plainPassword: string): Promise<boolean> {
    const userIdentifier = this.login || this.email || 'desconhecido';
    console.log('🔐 comparePassword chamado para:', userIdentifier);
    console.log('🔐 Password recebido (hash):', this.password ? `${this.password.substring(0, 30)}...` : 'NULL');
    console.log('🔐 Password length:', this.password?.length || 0);
    console.log('🔐 Plain password (input):', plainPassword ? `*** (length: ${plainPassword.length})` : 'NULL');
    
    // Verifica se a senha está válida (não null, undefined ou vazia)
    if (!this.password || this.password.trim() === '') {
      console.warn(`⚠️ Usuário ${userIdentifier} tem senha inválida (null/vazia)`);
      return false;
    }
    
    // Verifica se a senha está hasheada (bcrypt hash sempre começa com $2a$, $2b$ ou $2y$)
    if (!this.password.startsWith('$2')) {
      console.warn(`⚠️ Usuário ${userIdentifier} tem senha não hasheada. Hash atual:`, this.password.substring(0, 50));
      console.warn(`⚠️ Tentando fazer hash agora e comparar...`);
      
      // Se a senha não está hasheada, tenta hashear e comparar (caso raro)
      try {
        const hashed = await bcrypt.hash(plainPassword, 10);
        return hashed === this.password;
      } catch (e) {
        return false;
      }
    }
    
    try {
      console.log('🔐 Chamando bcrypt.compare...');
      const result = await bcrypt.compare(plainPassword, this.password);
      console.log('🔐 Resultado bcrypt.compare:', result);
      
      if (!result) {
        console.warn(`⚠️ Senha não confere para ${userIdentifier}`);
        console.warn(`   Hash esperado começa com: ${this.password.substring(0, 30)}...`);
      }
      
      return result;
    } catch (error: any) {
      console.error(`❌ Erro ao comparar senha para usuário ${userIdentifier}:`, error?.message || error);
      console.error('Stack trace:', error?.stack);
      return false;
    }
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false,
      validate: {
        isEmail: {
          msg: 'Email deve ser válido (opcional)',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 255],
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    // Garante que password NUNCA seja excluído por padrão
    defaultScope: {
      attributes: { exclude: [] }, // Não exclui nada por padrão
    },
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const userIdentifier = user.login || user.email || 'desconhecido';
          console.log('🔐 Hashando senha antes de criar usuário:', userIdentifier);
          const hashed = await bcrypt.hash(user.password, 10);
          user.password = hashed;
          console.log('✅ Senha hasheada:', hashed.substring(0, 20) + '...');
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const userIdentifier = user.login || user.email || 'desconhecido';
          console.log('🔐 Hashando senha antes de atualizar usuário:', userIdentifier);
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

// Seed admin user
export async function seedAdminUser(): Promise<void> {
  const adminLogin = 'admin';
  const adminPassword = '123';
  
  console.log('🔍 Verificando/criando usuário admin...');
  const adminExists = await User.findOne({ 
    where: { login: adminLogin },
    attributes: { include: ['password'] } // Garante que password seja retornado
  });
  
  // Se admin não existe, cria
  if (!adminExists) {
    console.log('📝 Criando novo usuário admin...');
    const newAdmin = await User.create({
      login: adminLogin,
      password: adminPassword, // Será hasheado automaticamente pelo hook beforeCreate
      name: 'Administrador',
      role: 'admin',
    });
    console.log('✅ Usuário admin criado automaticamente');
    console.log('   Login:', newAdmin.login);
    console.log('   Password hash:', newAdmin.password ? `${newAdmin.password.substring(0, 30)}...` : 'NULL');
    return;
  }
  
  // Se admin existe, verifica se a senha está válida (hasheada)
  console.log('🔍 Admin encontrado. Verificando senha...');
  console.log('   Password:', adminExists.password ? `${adminExists.password.substring(0, 30)}...` : 'NULL');
  console.log('   Password length:', adminExists.password?.length || 0);
  console.log('   Starts with $2:', adminExists.password?.startsWith('$2') || false);
  
  const passwordIsValid = adminExists.password && 
                          adminExists.password.trim() !== '' && 
                          adminExists.password.startsWith('$2');
  
  if (!passwordIsValid) {
    console.log('⚠️ Admin encontrado com senha inválida. Removendo e recriando...');
    await adminExists.destroy();
    
    const newAdmin = await User.create({
      login: adminLogin,
      password: adminPassword, // Será hasheado automaticamente pelo hook beforeCreate
      name: 'Administrador',
      role: 'admin',
    });
    console.log('✅ Usuário admin recriado com senha hasheada corretamente');
    console.log('   Login:', newAdmin.login);
    console.log('   Password hash:', newAdmin.password ? `${newAdmin.password.substring(0, 30)}...` : 'NULL');
  } else {
    console.log('✅ Usuário admin já existe e está válido');
    console.log('   Login:', adminExists.login);
    console.log('   Role:', adminExists.role);
  }
}





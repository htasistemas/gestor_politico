# Gestor Político

Aplicação para gerenciar contatos e atividades políticas. O frontend continua em Angular e o backend agora é fornecido exclusivamente por uma API Spring Boot.

## Requisitos
- Java 17+
- Maven 3.9+
- PostgreSQL 13+
- Node.js 18+ (para o frontend Angular)

## Configuração do Banco de Dados

Crie um banco chamado `gestor_politico` e certifique-se de possuir um usuário com acesso. Por padrão a aplicação utiliza as credenciais abaixo, que podem ser sobrescritas por variáveis de ambiente:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/gestor_politico
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=admin
```

Ao iniciar a aplicação um usuário padrão é criado automaticamente (caso não exista):

- Usuário: `admin@plataforma.gov`
- Senha: `123456`

As tabelas são gerenciadas automaticamente pelo Hibernate utilizando `spring.jpa.hibernate.ddl-auto=update`.

## Backend (Spring Boot)

1. Acesse a pasta `backend-java`.
2. Compile e execute a API:
   ```bash
   mvn spring-boot:run
   ```
3. A API ficará disponível em `http://localhost:8080`.

## Frontend (Angular)

1. Acesse a pasta `frontend`.
2. Instale as dependências e suba o servidor de desenvolvimento:
   ```bash
   npm install
   npm start
   ```
3. A aplicação estará acessível em `http://localhost:4200` e consumirá a API em `http://localhost:8080`.

# Guidelines

## Always use CLI commands for creating components

### Angular (currency-converter)
- Components: `ng g component components/<name>`
- Services: `ng g service services/<name>`
- Modules: `ng g module modules/<name>`
- Pipes: `ng g pipe pipes/<name>`
- Directives: `ng g directive directives/<name>`

### NestJS (currency-converter-backend)
- Controllers: `nest g controller <name>`
- Services: `nest g service <name>`
- Modules: `nest g module <name>`
- Guards: `nest g guard <name>`
- Filters: `nest g filter <name>`
- Interceptors: `nest g interceptor <name>`
- Resolvers (GraphQL): `nest g resolver <name>`

**Never manually create these files.**
# Tratamento Global de Erros no Spring Boot

Este módulo demonstra como migrar o tratamento de erros do backend Express para um `@ControllerAdvice` global no Spring Boot.

## Como funciona

- **`BusinessException`** representa erros de regra de negócio que no Express eram retornados com `res.status(400|422)`.
- **`ValidationException`** encapsula problemas de validação explícita (equivalente aos `return res.status(400)` do Express).
- **`MethodArgumentNotValidException`** cobre validações do Bean Validation anotadas diretamente nos DTOs.
- **`RuntimeException`** captura falhas inesperadas que no Express resultavam em `res.status(500)` ou em `next(err)`.

Todas as respostas seguem o mesmo padrão JSON:

```json
{
  "code": "IDENTIFICADOR_DO_ERRO",
  "message": "Descrição legível do problema"
}
```

Erros de validação incluem um objeto `errors` com os detalhes campo a campo.

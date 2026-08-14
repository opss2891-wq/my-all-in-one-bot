# Dependency Graph: DataBot

```mermaid
graph TD
    Auth[Firebase Authentication] --> UserID[User Identity Context]
    UserID --> Firestore[Firestore User-Scoped Queries]
    Firestore --> Conversations[Conversation Module]
    Firestore --> Messages[Messages/Data Module]
    UserID --> Encryption[Credential Encryption Layer]
    Encryption --> Credentials[Credentials Module]
    AIKeys[API Key Management] --> AI[AI Engine / Gemini]
```

## Core Dependencies
1. **Auth** is the foundation for everything. Without it, data isolation and encryption are impossible to implement correctly.
2. **User Identity** flows into every database operation.
3. **Encryption** depends on a secure user key (derived from auth).

---
*Created during Dependency Graph phase.*

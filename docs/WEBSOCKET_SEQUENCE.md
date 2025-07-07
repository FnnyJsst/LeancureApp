# Diagramme de séquence WebSocket

## 1. Connexion initiale et souscription

```mermaid
sequenceDiagram
    participant Client as Client RN
    participant WS as Serveur WebSocket
    participant API as API REST

    Client->>WS: Connexion WebSocket
    WS->>Client: Handshake (101 Switching Protocols)

    Client->>WS: {"sender": "client", "subscriptions": [...]}
    WS->>WS: Enregistrement des souscriptions
    WS->>Client: Confirmation (logs)

    Note over Client,WS: Client maintenant abonné aux notifications
```

## 2. Envoi d'un message et notification

```mermaid
sequenceDiagram
    participant User as Utilisateur
    participant Client as Client RN
    participant API as API REST
    participant DB as Base de données
    participant WS as Serveur WebSocket
    participant OtherClients as Autres clients

    User->>Client: Envoie un message
    Client->>API: POST /ic.php (message/add)
    API->>DB: Sauvegarde du message
    DB->>API: Confirmation

    API->>WS: Connexion éphémère
    API->>WS: {"sender": "server", "notification": {...}}

    WS->>WS: Vérification des abonnements
    WS->>OtherClients: Diffusion aux clients concernés
    WS->>API: Fermeture de la connexion éphémère

    OtherClients->>OtherClients: Mise à jour de l'interface
```

## 3. Gestion des déconnexions

```mermaid
sequenceDiagram
    participant Client as Client RN
    participant WS as Serveur WebSocket

    Client->>WS: Trame Close (0x8)
    WS->>Client: Trame Close de réponse
    WS->>WS: Suppression du client
    WS->>WS: Nettoyage des ressources

    Note over WS: Client déconnecté proprement
```

## 4. Ping/Pong pour maintenir la connexion

```mermaid
sequenceDiagram
    participant Client as Client RN
    participant WS as Serveur WebSocket

    Client->>WS: Ping (0x9)
    WS->>Client: Pong (0xA)

    Note over Client,WS: Connexion maintenue active
```

## 5. Gestion des erreurs et reconnexion

```mermaid
sequenceDiagram
    participant Client as Client RN
    participant WS as Serveur WebSocket

    Note over Client,WS: Connexion perdue (timeout, réseau, etc.)

    Client->>Client: Détection de déconnexion
    Client->>Client: Attente (backoff exponentiel)
    Client->>WS: Tentative de reconnexion
    WS->>Client: Handshake
    Client->>WS: Renouvellement des souscriptions

    Note over Client,WS: Reconnexion réussie
```

## 6. Flux complet d'une session de messagerie

```mermaid
sequenceDiagram
    participant User1 as Utilisateur A
    participant Client1 as Client A
    participant API as API REST
    participant WS as Serveur WebSocket
    participant Client2 as Client B
    participant User2 as Utilisateur B

    User1->>Client1: Ouvre le canal "Production"
    Client1->>WS: Souscription au canal "Production"

    User2->>Client2: Ouvre le canal "Production"
    Client2->>WS: Souscription au canal "Production"

    User1->>Client1: Envoie un message
    Client1->>API: Sauvegarde du message
    API->>WS: Notification de nouveau message
    WS->>Client2: Diffusion de la notification
    Client2->>User2: Affichage du nouveau message

    Note over User1,User2: Communication en temps réel établie
```

## Points clés du système

### 1. **Connexions persistantes**
- Les clients maintiennent une connexion WebSocket ouverte
- Permet la réception instantanée des notifications

### 2. **Souscriptions dynamiques**
- Les clients s'abonnent aux canaux qu'ils consultent
- Réduction du trafic réseau (pas de notifications inutiles)

### 3. **Connexions éphémères pour notifications**
- L'API crée une connexion temporaire pour envoyer des notifications
- Évite le couplage fort entre API et WebSocket

### 4. **Gestion robuste des erreurs**
- Reconnexion automatique côté client
- Nettoyage propre des ressources côté serveur
- Gestion des timeouts et déconnexions

### 5. **Performance optimisée**
- Diffusion ciblée (seuls les clients concernés reçoivent les notifications)
- Buffer intelligent pour les trames fragmentées
- Boucle non-bloquante avec timeout
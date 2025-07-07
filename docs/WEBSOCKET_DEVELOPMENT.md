# Guide de développement WebSocket

## Structure du code

### Serveur WebSocket (`websocket_server.php`)

#### Fonctions principales

##### `handleTextMessage($payloadJSON, $socket, &$clients)`
Traite les messages texte reçus et détermine leur origine (client ou serveur).

```php
function handleTextMessage($payloadJSON, $socket, &$clients) {
    $decodedJson = json_decode($payloadJSON, true);

    switch ($decodedJson['sender']) {
        case 'client':
            // Mise à jour des souscriptions
            $clients[$clientId]['subscriptions'] = $decodedJson['subscriptions'];
            break;

        case 'server':
            // Diffusion des notifications
            foreach ($clients as $cid => $clientData) {
                if (isSubscribed($clientData['subscriptions'], $notification)) {
                    // Envoi de la notification
                }
            }
            break;
    }
}
```

##### `isSubscribed($clientSubscriptions, $notification)`
Détermine si un client doit recevoir une notification basée sur ses souscriptions.

```php
function isSubscribed(array $clientSubscriptions, array $notification): bool {
    foreach ($clientSubscriptions as $subscription) {
        // Vérification package/page
        if ($subscription['package'] !== $notification['package'] ||
            $subscription['page'] !== $notification['page']) {
            continue;
        }

        // Vérification des filtres
        $subValues = $subscription['filters']['values'];
        $notifValues = $notification['filters']['values'];

        // Logique de correspondance...
    }
}
```

##### `serverEncode($payload, $type)` et `serverDecode($buffer)`
Gestion du protocole WebSocket (encodage/décodage des trames).

## Ajout de nouveaux types de notifications

### 1. Définir le nouveau type dans les constantes

```php
// Dans amaiia_msg_srv_const.php
if (!defined('AMAIIA_NOTIFICATION_TYPE_ALERT')) {
    define('AMAIIA_NOTIFICATION_TYPE_ALERT', 'alert');
}
```

### 2. Créer la fonction de notification dans l'API

```php
// Dans amaiia_msg_srv_cmd.php
function sendAlertNotification($alertData, $constellationid, $sitegroupid) {
    $notification = [
        'sender' => 'server',
        'type' => 'alert',
        'notification' => [
            'package' => 'amaiia_msg_srv',
            'page' => 'alerts',
            'filters' => [
                'values' => [
                    'alertType' => $alertData['type'],
                    'severity' => $alertData['severity']
                ]
            ],
            'data' => $alertData,
            'message' => "Nouvelle alerte : " . $alertData['title']
        ]
    ];

    // Envoi via WebSocket
    sendWebSocketNotification($notification);
}
```

### 3. Mettre à jour le client React Native

```javascript
// Dans useWebSocket.js
const subscribeToAlerts = (alertTypes, severityLevels) => {
    const subscriptions = [
        {
            package: 'amaiia_msg_srv',
            page: 'alerts',
            filters: {
                values: {
                    alertType: alertTypes,
                    severity: severityLevels
                }
            }
        }
    ];

    sendMessage({
        sender: 'client',
        subscriptions: subscriptions
    });
};
```

## Gestion des erreurs et debugging

### Logs côté serveur

Le serveur WebSocket affiche des logs détaillés :

```bash
# Connexion
Nouveau client connecté

# Souscription
Client 123 mis à jour avec ses souscriptions.

# Notification
Notification envoyée à client 456 : {"type":"message","notification":{...}}

# Déconnexion
Client 123 déconnecté (code: 1000)
```

### Debugging côté client

```javascript
// Dans useWebSocket.js
useEffect(() => {
    if (socket) {
        socket.onopen = () => {
            console.log('WebSocket connecté');
        };

        socket.onmessage = (event) => {
            console.log('Message reçu:', event.data);
            // Traitement du message
        };

        socket.onerror = (error) => {
            console.error('Erreur WebSocket:', error);
        };

        socket.onclose = (event) => {
            console.log('WebSocket fermé:', event.code, event.reason);
        };
    }
}, [socket]);
```

## Tests et validation

### Test de connectivité

```bash
# Test avec wscat (outil en ligne de commande)
npm install -g wscat
wscat -c ws://localhost:8000

# Envoi d'une souscription de test
{"sender": "client", "subscriptions": [{"package": "test", "page": "test", "filters": {"values": {"test": true}}}]}
```

### Test de notification

```php
// Script de test PHP
<?php
$socket = fsockopen('localhost', 8000);
if ($socket) {
    // Handshake WebSocket
    $key = base64_encode(random_bytes(16));
    $headers = "GET / HTTP/1.1\r\n";
    $headers .= "Host: localhost:8000\r\n";
    $headers .= "Upgrade: websocket\r\n";
    $headers .= "Connection: Upgrade\r\n";
    $headers .= "Sec-WebSocket-Key: $key\r\n";
    $headers .= "Sec-WebSocket-Version: 13\r\n\r\n";

    fwrite($socket, $headers);
    $response = fread($socket, 1024);

    // Envoi d'une notification de test
    $notification = json_encode([
        'sender' => 'server',
        'notification' => [
            'package' => 'test',
            'page' => 'test',
            'filters' => ['values' => ['test' => 'value']],
            'message' => 'Test notification'
        ]
    ]);

    // Encodage et envoi
    $frame = serverEncode($notification, 'text');
    fwrite($socket, $frame);

    fclose($socket);
}
?>
```

## Performance et monitoring

### Métriques à surveiller

```php
// Ajout de métriques dans websocket_server.php
$metrics = [
    'connections' => count($clients),
    'messages_sent' => 0,
    'messages_received' => 0,
    'errors' => 0
];

// Dans handleTextMessage()
$metrics['messages_received']++;

// Dans la diffusion
$metrics['messages_sent'] += count($recipients);
```

### Monitoring en temps réel

```php
// Affichage des métriques toutes les 30 secondes
if (time() % 30 === 0) {
    echo "=== Métriques WebSocket ===\n";
    echo "Clients connectés: " . $metrics['connections'] . "\n";
    echo "Messages reçus: " . $metrics['messages_received'] . "\n";
    echo "Messages envoyés: " . $metrics['messages_sent'] . "\n";
    echo "Erreurs: " . $metrics['errors'] . "\n";
    echo "========================\n";
}
```

## Sécurité

### Validation des messages

```php
function validateMessage($message) {
    $required = ['sender'];

    foreach ($required as $field) {
        if (!isset($message[$field])) {
            return false;
        }
    }

    // Validation selon le type de message
    switch ($message['sender']) {
        case 'client':
            return isset($message['subscriptions']) && is_array($message['subscriptions']);
        case 'server':
            return isset($message['notification']) && is_array($message['notification']);
        default:
            return false;
    }
}
```

### Rate limiting

```php
// Limitation du nombre de messages par client
$clientMessageCount = [];
$maxMessagesPerMinute = 100;

function checkRateLimit($clientId) {
    global $clientMessageCount, $maxMessagesPerMinute;

    $currentTime = time();
    $minute = floor($currentTime / 60);

    if (!isset($clientMessageCount[$clientId][$minute])) {
        $clientMessageCount[$clientId][$minute] = 0;
    }

    if ($clientMessageCount[$clientId][$minute] >= $maxMessagesPerMinute) {
        return false;
    }

    $clientMessageCount[$clientId][$minute]++;
    return true;
}
```

## Déploiement en production

### Configuration système

```bash
# Augmentation des limites système
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Configuration PHP
memory_limit = 512M
max_execution_time = 0
```

### Service systemd

```ini
# /etc/systemd/system/websocket-server.service
[Unit]
Description=WebSocket Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/websocket
ExecStart=/usr/bin/php websocket_server.php
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Monitoring avec supervisor

```ini
# /etc/supervisor/conf.d/websocket.conf
[program:websocket-server]
command=/usr/bin/php /path/to/websocket/websocket_server.php
directory=/path/to/websocket
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/websocket-server.log
```

## Évolutions futures

### 1. Clustering avec Redis

```php
// Utilisation de Redis pour partager l'état entre serveurs
$redis = new Redis();
$redis->connect('127.0.0.1', 6379);

// Stockage des souscriptions
$redis->hSet("subscriptions", $clientId, json_encode($subscriptions));

// Publication des notifications
$redis->publish("notifications", json_encode($notification));
```

### 2. Authentification

```php
// Vérification du token JWT
function authenticateClient($token) {
    try {
        $decoded = JWT::decode($token, $secret, ['HS256']);
        return $decoded->user_id;
    } catch (Exception $e) {
        return false;
    }
}
```

### 3. Compression des messages

```php
// Compression gzip pour les gros messages
function compressMessage($message) {
    return gzencode(json_encode($message));
}

function decompressMessage($compressed) {
    return json_decode(gzdecode($compressed), true);
}
```
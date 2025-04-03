#!/bin/bash

# Remplacer par votre token Expo
TOKEN="ExponentPushToken[UjmgiqJ63T-hAu33bUl_J8]"

# Créer le message JSON
MESSAGE='{
  "to": "'$TOKEN'",
  "sound": "default",
  "title": "Test de notification",
  "body": "Ceci est un test de notification",
  "data": { "testData": "test" }
}'

# Envoyer la notification
curl -H "Content-Type: application/json" \
     -X POST \
     -d "$MESSAGE" \
     https://exp.host/--/api/v2/push/send
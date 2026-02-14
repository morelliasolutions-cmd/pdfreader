#!/bin/bash
# Script de build pour Florence-2 Docker image

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Construction de l'image Docker Florence-2...${NC}"

# Nom de l'image
IMAGE_NAME="florence-2-runpod"
IMAGE_TAG="latest"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}❌ Docker n'est pas installé. Veuillez installer Docker d'abord.${NC}"
    exit 1
fi

# Construire l'image
echo -e "${BLUE}📦 Construction de l'image...${NC}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image construite avec succès: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
    echo ""
    echo -e "${BLUE}📋 Commandes utiles:${NC}"
    echo -e "  Tester localement:"
    echo -e "    ${YELLOW}docker run --gpus all -p 8000:8000 ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
    echo ""
    echo -e "  Taguer pour GitHub Container Registry:"
    echo -e "    ${YELLOW}docker tag ${IMAGE_NAME}:${IMAGE_TAG} ghcr.io/VOTRE_USERNAME/${IMAGE_NAME}:${IMAGE_TAG}${NC}"
    echo ""
    echo -e "  Publier sur GitHub:"
    echo -e "    ${YELLOW}docker push ghcr.io/VOTRE_USERNAME/${IMAGE_NAME}:${IMAGE_TAG}${NC}"
else
    echo -e "${YELLOW}❌ Erreur lors de la construction de l'image${NC}"
    exit 1
fi


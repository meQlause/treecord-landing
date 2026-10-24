#!/usr/bin/env bash
# One-off Google Cloud setup for the landing's CI/CD. Run it once, as an Owner of the project:
#
#   gcloud auth login            # as the project's Owner
#   bash deploy/gcp-setup.sh
#
# It is safe to run again. It creates: a Docker registry, a deployer service account (what GitHub Actions signs
# in as) and a runtime service account (what the site runs as, with no permissions), and a workload identity
# pool that lets ONLY the master branch of the landing repo act as the deployer. No keys are created or stored.
set -euo pipefail

PROJECT=treecord-512605
REGION=asia-southeast1
GITHUB_REPO=meQlause/treecord-landing
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
DEPLOYER="landing-deployer@$PROJECT.iam.gserviceaccount.com"
RUNTIME="landing-runtime@$PROJECT.iam.gserviceaccount.com"

gcloud services enable run.googleapis.com artifactregistry.googleapis.com iam.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com --project "$PROJECT"

gcloud artifacts repositories describe treecord --location "$REGION" --project "$PROJECT" >/dev/null 2>&1 ||
  gcloud artifacts repositories create treecord --repository-format docker --location "$REGION" \
    --description "treecord container images" --project "$PROJECT"

for account in landing-deployer landing-runtime; do
  gcloud iam service-accounts describe "$account@$PROJECT.iam.gserviceaccount.com" --project "$PROJECT" >/dev/null 2>&1 ||
    gcloud iam service-accounts create "$account" --display-name "$account" --project "$PROJECT"
done

# what the deployer may do: deploy Cloud Run services, push to this one registry, and run a service as the runtime account
gcloud projects add-iam-policy-binding "$PROJECT" --member "serviceAccount:$DEPLOYER" --role roles/run.admin \
  --condition None --quiet >/dev/null
gcloud artifacts repositories add-iam-policy-binding treecord --location "$REGION" --project "$PROJECT" \
  --member "serviceAccount:$DEPLOYER" --role roles/artifactregistry.writer --quiet >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME" --project "$PROJECT" \
  --member "serviceAccount:$DEPLOYER" --role roles/iam.serviceAccountUser --quiet >/dev/null

# who may become the deployer: only this repo, only from its master branch
gcloud iam workload-identity-pools describe github --location global --project "$PROJECT" >/dev/null 2>&1 ||
  gcloud iam workload-identity-pools create github --location global --display-name "GitHub Actions" --project "$PROJECT"
gcloud iam workload-identity-pools providers describe github-landing --location global \
  --workload-identity-pool github --project "$PROJECT" >/dev/null 2>&1 ||
  gcloud iam workload-identity-pools providers create-oidc github-landing --location global \
    --workload-identity-pool github --project "$PROJECT" \
    --issuer-uri "https://token.actions.githubusercontent.com" \
    --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition "assertion.repository=='$GITHUB_REPO' && assertion.ref=='refs/heads/master'"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" --project "$PROJECT" \
  --role roles/iam.workloadIdentityUser --quiet >/dev/null \
  --member "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$GITHUB_REPO"

echo "Done. Merging to master now deploys the landing to Cloud Run service treecord-landing in $REGION."

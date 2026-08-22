---
name: deliveryguard-artifact-intake
description: Validate and register a local or public evidence artifact without uploading it to an external service.
---

# Artifact intake

Resolve exactly one artifact, verify its media type, size, checksum, provenance, and absence of secrets or personal data, then copy it into a repository-relative evidence path when authorized. For remote inputs, accept only public HTTPS sources and record the source URL. This skill never uploads to a CDN or private service. Add the final relative path to the Evidence Manifest and validate it before reporting registration complete.

# Modules

One folder per module of the modular monolith. Each module owns its tables and exposes a service interface or domain events; no module reads another module's tables (architecture rule 9). Infrastructure shared by all modules (environment, logging, errors, i18n, connections, health) lives in `src/core/`.

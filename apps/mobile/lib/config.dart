/// Build-time settings, passed with `--dart-define` (see `.env.example`). Never put secrets here: anything compiled
/// into the app can be read from it.
class AppConfig {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3001');
}

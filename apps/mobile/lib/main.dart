import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'l10n/app_localizations.dart';

void main() {
  runApp(const QuizateApp());
}

/// Arabic is the default locale and the layout is right to left; English follows the device when chosen.
class QuizateApp extends StatelessWidget {
  const QuizateApp({super.key, this.locale = const Locale('ar')});

  final Locale locale;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      onGenerateTitle: (context) => AppLocalizations.of(context).appName,
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(colorSchemeSeed: const Color(0xFF0A72AD), useMaterial3: true),
      home: const HomePlaceholder(),
    );
  }
}

class HomePlaceholder extends StatelessWidget {
  const HomePlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsetsDirectional.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(t.appName, style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: 8),
                Text(t.tagline, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                FilledButton(onPressed: null, child: Text(t.comingSoon)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quizate/main.dart';

void main() {
  testWidgets('opens in Arabic, right to left', (tester) async {
    await tester.pumpWidget(const QuizateApp());
    await tester.pumpAndSettle();

    expect(find.text('كويزاتي'), findsOneWidget);
    final context = tester.element(find.byType(HomePlaceholder));
    expect(Directionality.of(context), TextDirection.rtl);
  });

  testWidgets('English reads left to right', (tester) async {
    await tester.pumpWidget(const QuizateApp(locale: Locale('en')));
    await tester.pumpAndSettle();

    expect(find.text('Quizate'), findsOneWidget);
    final context = tester.element(find.byType(HomePlaceholder));
    expect(Directionality.of(context), TextDirection.ltr);
  });
}

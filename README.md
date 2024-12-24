# Verkehrsunfall-Dashboard

## Projektbeschreibung
Dieses Projekt ist ein interaktives Dashboard zur Visualisierung von Verkehrsunfällen in Mainz. Ziel ist es, Daten zu Unfällen basierend auf verschiedenen Kategorien wie Schweregrad, Zeit, Ort und Modellunsicherheiten zu analysieren und visualisieren.

Das Dashboard bietet:
- Visualisierung von Unfallpunkten auf einer Karte.
- Interaktive Filteroptionen (z. B. nach Jahr, Monat, Stadtteil).
- Cluster-Darstellung von Unfallpunkten basierend auf Dichte und Schweregrad.
- Anzeige von Unsicherheiten des Modells.
- Integration von SHAP-Werten für eine detaillierte Analyse der Modellentscheidungen.

## Technologien
- **HTML, CSS, JavaScript**: Frontend-Entwicklung.
- **Leaflet**: Kartenvisualisierung und Marker-Cluster.
- **D3.js**: Farbskalen und andere Visualisierungsfeatures.
- **XGBoost**: Maschinelles Lernmodell für die Vorhersage.

## Installation
1. Repository klonen:
   ```bash
   git clone https://github.com/Amirzahedid/Accident-Analytics-Dashboard.git
   ```
2. Abhängigkeiten installieren:
   Es sind keine zusätzlichen Installationen erforderlich. Der Code nutzt externe Bibliotheken über CDN.

3. Projekt starten:
   Öffnen Sie die Datei `index.html` in einem Browser.

## Nutzung
1. **Kartenansicht**: Die Karte zeigt Unfallpunkte in Mainz. Punkte können nach Schweregrad und anderen Kriterien gefiltert werden.
2. **Cluster-Darstellung**: Cluster visualisieren Dichte und Schweregrad von Unfällen.
3. **SHAP-Analyse**: Klicken Sie auf einen Punkt, um die SHAP-Werte zu analysieren.

## Lizenz
Dieses Projekt steht unter der MIT-Lizenz. Siehe die Datei `LICENSE` für weitere Details.

## Beitrag
Beiträge sind willkommen! Bitte erstellen Sie einen Pull-Request oder öffnen Sie ein Issue, wenn Sie Vorschläge oder Fragen haben.

## Kontakt
Amir Zahedidarehshoori  
E-Mail: amirzahedi01@gmail.com

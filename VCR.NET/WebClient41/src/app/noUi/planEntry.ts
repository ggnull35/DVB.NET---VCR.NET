﻿namespace VCRNETClient.App.NoUi {

    // Erweiterte Schnittstelle (View Model) zur Anzeige eines Eintrags des Aufzeichnunsplans.
    export interface IPlanEntry extends VCRServer.PlanActivityContract {
        // Ein Kürzel für die Qualität der Aufzeichnung, etwa ob dieser verspätet beginnt.
        mode: string;

        // Der Zeitpunkt, an dem die Aufzeichnung enden wird.
        end: Date;

        // Der Startzeitpunkt formatiert für die Darstellung.
        displayStart: string;

        // Der Endzeitpunkt, formatiert für die Darstellung - es werden nur Stunden und Minuten angezeigt.
        displayEnd: string;

        // Die zugehörige Ausnahmeregel.
        exception: IPlanException;

        // Zeigt die Programmzeitschrift an.
        showEpg: boolean;

        // Zeigt die Pflege der Ausnahmeregel an.
        showException: boolean;

        // Schaltet die Detailanzeige um.
        toggleDetail(epg: boolean): void;

        // Anwendungsverweis zum Ändern dieses Eintrags.
        editLink: string;
    }

    // Initialisiert ein View Model für einen Eintrag des Aufzeichnungsplans.
    export function enrichPlanEntry(entry: VCRServer.PlanActivityContract, toggleDetail: (entry: IPlanEntry, epg: boolean) => void, application: App.Application, reload: () => void): IPlanEntry {
        if (!entry)
            return null;

        var enriched = <IPlanEntry>entry;

        // Defaultwerte einsetzen
        if (enriched.station == null)
            enriched.station = '(unbekannt)';
        if (enriched.device == null)
            enriched.device = '';

        // Zeiten umrechnen
        var duration = 1000 * (enriched.duration as any);
        var start = new Date(enriched.start);
        var end = new Date(start.getTime() + duration);

        // Daten aus der Rohdarstellung in das Modell kopieren
        enriched.displayStart = DateFormatter.getStartTime(enriched.start = start);
        enriched.displayEnd = DateFormatter.getEndTime(enriched.end = end);
        enriched.duration = duration / 1000;

        // Ausnahmen auswerten
        enriched.exception = enrichPlanException(enriched.exception, enriched.id, reload);

        // Aufzeichungsmodus ermitteln
        if (enriched.station !== 'PSI')
            if (enriched.station !== 'EPG')
                if (enriched.lost)
                    enriched.mode = 'lost';
                else if (enriched.late)
                    enriched.mode = 'late';
                else
                    enriched.mode = 'intime';

        // Verweise.
        if (enriched.mode)
            enriched.editLink = `edit;id=${enriched.id}`;

        // Methoden.
        enriched.toggleDetail = epg => toggleDetail(enriched, epg);

        return enriched;
    }
}
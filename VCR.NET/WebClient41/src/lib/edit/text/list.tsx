﻿/// <reference path="../../reactUi.tsx" />

namespace JMSLib.ReactUi {

    // Verwaltete eine Zeichenkette, die über eine einfache Auswahlliste festgelegt wird.
    export class EditTextWithList extends ComponentWithSite<App.IValidateStringFromList>  {
        // Erstellt die Anzeige für die Komponente.
        render(): JSX.Element {
            return <select
                className="jmslib-edittextlist"
                value={`${this.props.noui.value}`}
                title={this.props.noui.message}
                onChange={ev => this.props.noui.value = (ev.target as HTMLSelectElement).value}>
                {this.props.noui.allowedValues.map(av => <option key={av.display} value={`${av.value}`}>{av.display}</option>)}
            </select>;
        }
    }
}

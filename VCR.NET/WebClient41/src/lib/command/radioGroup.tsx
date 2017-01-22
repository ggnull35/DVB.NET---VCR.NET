﻿/// <reference path="../reactUi.tsx" />

namespace JMSLib.ReactUi {
    export class RadioGroup extends React.Component<IEmpty, IEmpty>{
        render(): JSX.Element {
            return <div className="vcrnet-radioGroup">{this.props.children}</div>
        }
    }
}

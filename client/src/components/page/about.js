import React from 'react';

class PageAbout extends React.Component {
    render() {
        return (
            <div className="panel">
                <div className="panel-body">
                    <h2>Acknowledgement</h2>
                    <p>
                        This project is based on <strong>Streetwars Online 2</strong>, a game by B.Smith aka Wuzzbent from 2000, which I hacked on and expanded extensively  when I was a kid.<br/>I would very likely not have become a programmer where it not for him making his game open source.<br/>
                        <br/>
                        Thank you! - SirMrE
                    </p>
                </div>
            </div>
        );
    }
}

export default PageAbout;

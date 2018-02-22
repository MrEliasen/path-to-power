import React from 'react';

class PageHome extends React.Component {
    render() {
        return (
            <div id="home">
                <div className="panel">
                    <div className="panel-body">
                        <h1>Path To Power Online (Alpha)</h1>
                        <p>A simple open source <a href="" target="_blank">MUD</a>, inspired heavily from an a MUD called Street Wars Online 2, from 2000, by B.Smith aka Wuzzbent.</p>
                        <p>The development of the game, and continued development, is streamed lived on <a href="https://twitch.tv/sirmre" target="_blank">Twitch.tv/SirMrE</a>. The game is Open Source, and you can grap a copy from <a href="https://github.com/MrEliasen/path-to-power-server" target="_blank">GitHub</a>!</p>
                        <hr />
                        <p><strong>Note:</strong> The game is very far from done. Game wipes are likely to happen. A lot of design and help features are not in the game yet.</p>
                    </div>
                </div>
            </div>
        );
    }
}

export default PageHome;

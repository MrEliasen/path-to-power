import React from 'react';

class Home extends React.Component {
    render() {
        return (
            <React.Fragment>
                <div className="panel" id="home">
                    <h1>Path To Power Online (Alpha)</h1>
                    <p>A simple open source <a href="" target="_blank">MUD</a>, inspired heavily from an a MUD called Street Wars Online 2, from 2000, by B.Smith aka Wuzzbent.</p>
                    <p>The development of the game, and continued development, is streamed lived on <a href="https://twitch.tv/sirmre" target="_blank">Twitch.tv/SirMrE</a>. The game is Open Source, and you can grap a copy from <a href="https://github.com/MrEliasen/path-to-power-server" target="_blank">GitHub</a>!</p>
                    <p style={{background: '#fb8743', padding: '8px 15px'}}>
                        <strong>Note:</strong> The game is very far from done. Game wipes are likely to happen. A lot of design and help features are not in the game yet.
                    </p>
                </div>

                <div className="panel">
                    <h2>About The Game</h2>
                    <p>The game is simple. Deal drugs and fight in PvP and PvE to gain reputation. The more reputation you have, the more things you unlock to buy and improve.</p>
                    <p>The game is full loot PvP/PvE. If you get killed, you drop everything you have on you. High risk, high reward.</p>
                    <p></p>
                </div>

                <div className="panel">
                    <h2>Acknowledgement</h2>
                    <p>
                        This project is based on <strong>Streetwars Online 2</strong>, a game by B.Smith aka Wuzzbent from 2000, which I hacked on and expanded extensively  when I was a kid.<br/>I would very likely not have become a programmer where it not for him making his game open source.<br/>
                        <br/>
                        Thank you! - SirMrE
                    </p>
                </div>
            </React.Fragment>
        );
    }
}

export default Home;

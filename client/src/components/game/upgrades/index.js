import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Modal, ModalHeader, ModalBody, Button} from 'reactstrap';

// actions
import {buyEnhancement} from './actions';

class UpgradesModal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Modal isOpen={this.props.visible} toggle={this.props.toggleMethod} size="lg">
                <ModalHeader toggle={this.props.toggleMethod}>Enhancements</ModalHeader>
                <ModalBody className="skills">
                    {
                        this.props.character &&
                        this.props.enhancements &&
                        this.props.enhancements.map((enhancement) => {
                            const charEnhancement = this.props.character.enhancements[enhancement.id];
                            const enhPoints = this.props.character.stats.enhPoints;
                            const currentLevel = charEnhancement ? charEnhancement.modifiers.value : 0;
                            const nextLevel = enhancement.tree[currentLevel]; // enhancement levels starts 1, but arrays 0, so no need to modify the key./

                            return (
                                <div key={enhancement.id} className="skill-tree" >
                                    <div className="skill-tier">
                                        <h3>{enhancement.name} Lvl {currentLevel}</h3>
                                        <p>{enhancement.description}</p>
                                        {
                                            currentLevel > 0 &&
                                            <p><strong>Current Level:</strong> {enhancement.tree[currentLevel - 1].description}</p>
                                        }
                                        {
                                            nextLevel &&
                                            <div className="next-tier">
                                                <p><strong>Next Level:</strong> {nextLevel.description}</p>
                                                {
                                                    <Button
                                                        size="sm"
                                                        onClick={() => this.props.buyEnhancement(enhancement.id, nextLevel.tier)}
                                                        color="primary"
                                                        block={true}
                                                        disabled={enhPoints < nextLevel.expCost}
                                                    >
                                                        Purchase Level
                                                    </Button>
                                                }
                                            </div>
                                        }
                                    </div>
                                </div>
                            );
                        })
                    }
                </ModalBody>
            </Modal>
        );
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        buyEnhancement,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        enhancements: state.game.enhancements,
        character: state.character.selected || null,
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(UpgradesModal);

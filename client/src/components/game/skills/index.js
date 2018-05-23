import React from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {Modal, ModalHeader, ModalBody, Button} from 'reactstrap';

// actions
import {buySkill} from './actions';

class SkillsModal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Modal isOpen={this.props.visible} toggle={this.props.toggleMethod} size="lg">
                <ModalHeader toggle={this.props.toggleMethod}>Skills</ModalHeader>
                <ModalBody className="skills">
                    {
                        this.props.character &&
                        this.props.skills &&
                        this.props.skills.map((skill) => {
                            const characterSkill = this.props.character.skills.find((charSkill) => charSkill.id === skill.id);
                            const characterEXP = this.props.character.stats.exp;
                            const currentLevel = characterSkill ? characterSkill.modifiers.value : 0;
                            const nextLevel = skill.tree[currentLevel]; // skill levels starts 1, but arrays 0, so no need to modify the key./

                            return (
                                <div key={skill.id} className="skill-tree" >
                                    <div className="skill-tier">
                                        <h3>{skill.name} Lvl {currentLevel}</h3>
                                        <p>{skill.description}</p>
                                        {
                                            currentLevel > 0 &&
                                            <p><strong>Current Level:</strong> {skill.tree[currentLevel - 1].description}</p>
                                        }
                                        {
                                            nextLevel &&
                                            <div className="next-tier">
                                                <p><strong>Next Level:</strong> {nextLevel.description}</p>
                                                {
                                                    <Button
                                                        size="sm"
                                                        onClick={() => this.props.buySkill(skill.id, nextLevel.tier)}
                                                        color="primary"
                                                        block={true}
                                                        disabled={characterEXP < nextLevel.expCost}
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
        buySkill,
    }, dispatch);
}

function mapStateToProps(state) {
    return {
        skills: state.game.skills,
        character: state.character.selected || null,
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SkillsModal);

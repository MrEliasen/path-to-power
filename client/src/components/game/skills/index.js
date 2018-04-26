import React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';

import {Modal, ModalHeader, ModalBody, Button} from 'reactstrap';

class SkillsModal extends React.Component {
    render() {
        return (
            <Modal isOpen={this.props.visible} toggle={this.props.toggleMethod} size="lg">
                <ModalHeader toggle={this.props.toggleMethod}>Skills</ModalHeader>
                <ModalBody className="skills">
                    {
                        this.props.character &&
                        this.props.skills &&
                        this.props.skills.map((skill) => {
                            const characterSkill = this.props.character.skills[skill.id];
                            const currentLevel = characterSkill ? characterSkill.modifiers.value : 0;

                            return (
                                <div className="skill-tree">
                                    <div className="skill-name">
                                        <h3>{skill.name}</h3>
                                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Facilis placeat ullam eius dolor similique ipsum sunt optio maxime tempore sed.</p>
                                    </div>
                                    {
                                        skill.tree.map((tier) => {
                                            let available = false;
                                            let purchased = false;

                                            if (tier.tier <= currentLevel) {
                                                purchased = true;
                                            }
                                            
                                            if (tier.tier === currentLevel + 1) {
                                                available = true;
                                            }

                                            return (
                                                <div
                                                    className={classNames('skill-tier', {
                                                        '--purchased': purchased,
                                                        '--unavailable': !available,
                                                    })}
                                                >
                                                    <h3>Level {tier.tier}</h3>
                                                    <p class="cost">Costs {tier.expCost} EXP</p>
                                                    <p class="description">{tier.description}</p>
                                                    <Button color="primary" block={true}>
                                                        Purchase Level
                                                    </Button>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            );
                        })
                    }
                </ModalBody>
            </Modal>
        );
    }
}

function mapStateToProps(state) {
    return {
        skills: state.game.skills,
        character: state.character.selected || null,
    };
}

export default connect(mapStateToProps)(SkillsModal);

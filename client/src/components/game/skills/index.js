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
                            const characterSkill = this.props.character.skills[skill.id];
                            const characterEXP = this.props.character.stats.exp;
                            const currentLevel = characterSkill ? characterSkill.modifiers.value : 0;

                            return (
                                <div
                                    key={skill.id}
                                    className="skill-tree"
                                >
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
                                                    key={`${skill.id}-${tier.tier}`}
                                                    className={classNames('skill-tier', {
                                                        '--purchased': purchased,
                                                        '--unavailable': !available,
                                                    })}
                                                >
                                                    <h3>Level {tier.tier}</h3>
                                                    <p className="cost">Costs {tier.expCost} EXP</p>
                                                    <p className="description">{tier.description}</p>
                                                    {
                                                        !purchased &&
                                                        available &&
                                                        <Button onClick={() => this.props.buySkill(skill.id, tier.tier)} color="primary" block={true} disabled={characterEXP < tier.expCost}>
                                                            Purchase Level
                                                        </Button>
                                                    }
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

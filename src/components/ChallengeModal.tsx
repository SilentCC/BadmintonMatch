import React from 'react';

// Define the structure of a partnership
interface Player {
    name: string;
}

interface Partnership {
    id: number;
    player1: Player;
    player2: Player;
}

// Define the props for the ChallengeModal component
interface Props {
    partnerships: Partnership[];
    onSelectPartnership: (id: number) => void;
    onClose: () => void;
    onSubmit: () => void;
}

const ChallengeModal: React.FC<Props> = ({ partnerships, onSelectPartnership, onClose, onSubmit }) => {
    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Select a Partnership</h2>
                <select onChange={(e) => onSelectPartnership(Number(e.target.value))}>
                    <option value="">Select a Partnership</option>
                    {partnerships.map((partnership) => (
                        <option key={partnership.id} value={partnership.id}>
                            {partnership.player1.name} & {partnership.player2.name}
                        </option>
                    ))}
                </select>
                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={onSubmit}>Submit Challenge</button>
                </div>
            </div>
        </div>
    );
};

export default ChallengeModal;

import * as Vertex from './Vertex.js';
import * as States from './States.js';

export function getProbabilisticEvaluation(graph, node) {

    let winner = States.checkWinner(node.id);
    if (winner != null) {
        return winner == 'X' ? 1 : -1;
    }

    let outcomes = graph.getLeafDescendants(node);

    let xWins = 0;
    let oWins = 0;
    let ties = 0;

    outcomes.forEach(node => {
        switch (States.checkWinner(node.id)) {
            case 'X':
                ++xWins;
                break;
            case 'O':
                ++oWins;
                break;
            case null:
                ++ties;
                break;
        }
    });

    return (xWins - oWins + 0.5 * ties) / (xWins + oWins + ties);
}   

export function getMinimaxEvaluation(node, isXturn = true) {
    const winner = States.checkWinner(node.id);
    if (winner === 'X') return 1;
    if (winner === 'O') return -1;
    if (winner === null && Vertex.getChildren(node).length === 0) return 0;

    const children = Vertex.getChildren(node);

    if (isXturn) {
        return Math.max(...children.map(c => c.evaluation[1] == null ? getMinimaxEvaluation(c, false) : c.evaluation[1]));
    } else {
        return Math.min(...children.map(c => c.evaluation[1] == null ? getMinimaxEvaluation(c, true) : c.evaluation[1]));
    }
}
export const ADD_SCORE = 'ADD_SCORE';

export const addScore = (points) => ({
    type: ADD_SCORE,
    payload: points,
});

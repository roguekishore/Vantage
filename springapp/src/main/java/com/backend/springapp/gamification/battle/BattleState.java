package com.backend.springapp.gamification.battle;

public enum BattleState {
    WAITING,   // Lobby phase – waiting for both players to ready up
    ACTIVE,    // Battle in progress – timer running
    COMPLETED, // Battle finished normally
    CANCELLED  // Lobby timeout or both players left
}

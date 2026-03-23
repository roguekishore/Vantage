package com.backend.springapp.gamification.battle;

public record ActiveBattleDTO(Long battleId, String state, String mode, String roomCode) {}

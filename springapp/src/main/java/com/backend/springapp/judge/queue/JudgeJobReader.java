package com.backend.springapp.judge.queue;

import com.backend.springapp.gamification.battle.SubmitResultDTO;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

/** Turns job rows into the public status DTO (shared by the POST replay and the GET poll). */
@Service
@RequiredArgsConstructor
public class JudgeJobReader {

    private final JudgeJobRepository jobs;
    private final ObjectMapper mapper;

    /** Empty if the job does not exist or belongs to another battle or user. */
    public Optional<JudgeJobStatusDTO> find(Long jobId, Long battleId, Long userId) {
        return jobs.findById(jobId)
                .filter(j -> j.getBattleId().equals(battleId) && j.getUserId().equals(userId))
                .map(this::toDto);
    }

    public JudgeJobStatusDTO toDto(JudgeJob j) {
        SubmitResultDTO result = null;
        if (JudgeJob.DONE.equals(j.getStatus()) && j.getResultJson() != null) {
            try {
                result = mapper.readValue(j.getResultJson(), SubmitResultDTO.class);
            } catch (Exception e) {
                throw new IllegalStateException("Corrupt result for judge job " + j.getId(), e);
            }
        }
        String error = JudgeJob.FAILED.equals(j.getStatus()) ? j.getError() : null;
        return new JudgeJobStatusDTO(j.getId(), j.getStatus(), result, error);
    }
}

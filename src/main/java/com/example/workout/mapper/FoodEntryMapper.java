package com.example.workout.mapper;

import com.example.workout.dto.FoodEntryDTO;
import com.example.workout.entity.FoodEntry;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface FoodEntryMapper {

    FoodEntryDTO toDTO(FoodEntry foodEntry);

    List<FoodEntryDTO> toDTOList(List<FoodEntry> foodEntries);
}

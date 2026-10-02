package com.example.workout.mapper;

import com.example.workout.dto.DietSessionDTO;
import com.example.workout.entity.DietSession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {FoodEntryMapper.class})
public interface DietSessionMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "foodEntries", target = "foodEntries")
    DietSessionDTO toDTO(DietSession session);
}

package com.example.workout.service;

import com.example.workout.entity.User;
import com.example.workout.entity.UserProfile;
import com.example.workout.repository.UserProfileRepository;
import com.example.workout.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public UserProfile getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    newProfile.setUser(user);
                    return userProfileRepository.save(newProfile);
                });
    }

    @Transactional
    public UserProfile updateProfile(String username, UserProfile updatedProfile) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        if (updatedProfile.getAge() != null) profile.setAge(updatedProfile.getAge());
        if (updatedProfile.getWeight() != null) profile.setWeight(updatedProfile.getWeight());
        if (updatedProfile.getSkeletalMuscleMass() != null) profile.setSkeletalMuscleMass(updatedProfile.getSkeletalMuscleMass());
        if (updatedProfile.getBodyFatMass() != null) profile.setBodyFatMass(updatedProfile.getBodyFatMass());
        if (updatedProfile.getBasalMetabolicRate() != null) profile.setBasalMetabolicRate(updatedProfile.getBasalMetabolicRate());
        
        return userProfileRepository.save(profile);
    }
}

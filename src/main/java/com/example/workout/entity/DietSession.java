package com.example.workout.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "diet_sessions", indexes = {
    @Index(name = "idx_diet_user_id", columnList = "user_id"),
    @Index(name = "idx_diet_date", columnList = "date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DietSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String notes;

    @OneToMany(mappedBy = "dietSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FoodEntry> foodEntries = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (date == null) {
            date = LocalDate.now();
        }
    }

    public void addFoodEntry(FoodEntry entry) {
        foodEntries.add(entry);
        entry.setDietSession(this);
    }

    public void removeFoodEntry(FoodEntry entry) {
        foodEntries.remove(entry);
        entry.setDietSession(null);
    }
}

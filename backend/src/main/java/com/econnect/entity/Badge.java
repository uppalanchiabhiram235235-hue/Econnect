package com.econnect.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "badges")
@Getter @Setter @NoArgsConstructor
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "badge_name", nullable = false, unique = true, length = 60)
    private String badgeName;

    @Column(length = 300)
    private String description;

    @Column(length = 300)
    private String criteria;

    public Badge(String badgeName, String description, String criteria) {
        this.badgeName = badgeName;
        this.description = description;
        this.criteria = criteria;
    }
}

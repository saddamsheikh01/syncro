package com.syncro.backend.domain.relocation.repository;

import com.syncro.backend.domain.relocation.entity.RelocationCityWaitingList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RelocationCityWaitingListRepository extends JpaRepository<RelocationCityWaitingList, UUID> {

    List<RelocationCityWaitingList> findByCityNameAndNotifiedFalse(String cityName);

    boolean existsByEmailAndCityName(String email, String cityName);

    List<RelocationCityWaitingList> findByNotifiedFalseOrderByCreatedAtAsc();
}

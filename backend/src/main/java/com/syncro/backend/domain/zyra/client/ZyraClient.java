package com.syncro.backend.domain.zyra.client;

import java.util.List;

public interface ZyraClient {

    String chat(List<ZyraChatMessage> messages);
}

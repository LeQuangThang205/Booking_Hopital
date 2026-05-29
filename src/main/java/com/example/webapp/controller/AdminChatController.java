package com.example.webapp.controller;

import com.example.webapp.entity.*;
import com.example.webapp.service.ChatService;
import com.example.webapp.repository.ChatConversationRepository;
import com.example.webapp.repository.NguoiDungRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin-chat")
@CrossOrigin(origins = "*")
public class AdminChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private ChatConversationRepository conversationRepository;

    @Autowired
    private NguoiDungRepository userRepository;

    /**
     * Lấy danh sách khách hàng đang chờ admin
     */
    @GetMapping("/pending-conversations")
    public ResponseEntity<List<Map<String, Object>>> getPendingConversations() {
        List<ChatConversation> conversations = chatService.getPendingAdminConversations();

        List<Map<String, Object>> result = conversations.stream().map(conv -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", conv.getId());
            item.put("conversationId", conv.getConversationId());
            item.put("customerName", conv.getCustomerName() != null ? conv.getCustomerName() : "Khách hàng vô danh");
            item.put("customerPhone", conv.getCustomerPhone());
            item.put("status", conv.getStatus());
            item.put("lastMessageAt", conv.getLastMessageAt());
            item.put("assignedAdminId", conv.getAssignedAdmin() != null ? conv.getAssignedAdmin().getId() : null);
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Lấy danh sách khách hàng được gán cho admin hiện tại
     */
    @GetMapping("/my-conversations/{adminId}")
    public ResponseEntity<List<Map<String, Object>>> getMyConversations(@PathVariable Long adminId) {
        List<ChatConversation> conversations = chatService.getAdminConversations(adminId);

        List<Map<String, Object>> result = conversations.stream().map(conv -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", conv.getId());
            item.put("conversationId", conv.getConversationId());
            item.put("customerName", conv.getCustomerName() != null ? conv.getCustomerName() : "Khách hàng vô danh");
            item.put("customerPhone", conv.getCustomerPhone());
            item.put("status", conv.getStatus());
            item.put("lastMessageAt", conv.getLastMessageAt());
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Admin nhận một cuộc trò chuyện
     */
    @PostMapping("/accept/{conversationId}")
    public ResponseEntity<Map<String, String>> acceptConversation(
            @PathVariable String conversationId,
            @RequestBody Map<String, Long> body) {

        Long adminId = body.get("adminId");
        if (adminId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thiếu adminId, vui lòng đăng nhập lại"));
        }

        ChatConversation conversation = conversationRepository.findByConversationId(conversationId)
                .orElse(null);

        if (conversation == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cuộc trò chuyện không tồn tại"));
        }

        NguoiDung admin = userRepository.findById(adminId).orElse(null);
        if (admin == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Admin không tồn tại"));
        }

        chatService.assignAdminToConversation(conversation, admin);

        // Lưu thông báo
        ChatMessage notification = new ChatMessage(
                conversation,
                ChatSender.AI,
                "✨ Admin " + admin.getUsername() + " sẽ hỗ trợ bạn ngay bây giờ!",
                "Hệ Thống");
        // Lưu notification (có thể tùy chỉnh)

        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã nhận cuộc trò chuyện");
        response.put("conversationId", conversationId);

        return ResponseEntity.ok(response);
    }

    /**
     * Admin gửi tin nhắn
     */
    @PostMapping("/send-message")
    public ResponseEntity<Map<String, Object>> sendAdminMessage(@RequestBody Map<String, String> body) {
        String conversationId = body.get("conversationId");
        String message = body.get("message");
        String adminName = body.get("adminName");

        ChatConversation conversation = conversationRepository.findByConversationId(conversationId)
                .orElse(null);

        if (conversation == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cuộc trò chuyện không tồn tại"));
        }

        chatService.saveAdminMessage(conversation, message, adminName);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Tin nhắn đã được gửi");
        response.put("conversationId", conversationId);

        return ResponseEntity.ok(response);
    }

    /**
     * Lấy lịch sử tin nhắn của cuộc trò chuyện
     */
    @GetMapping("/conversation-history/{conversationId}")
    public ResponseEntity<Map<String, Object>> getConversationHistory(@PathVariable String conversationId) {
        ChatConversation conversation = conversationRepository.findByConversationId(conversationId)
                .orElse(null);

        if (conversation == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cuộc trò chuyện không tồn tại"));
        }

        List<ChatMessage> messages = chatService.getConversationHistory(conversation);

        Map<String, Object> response = new HashMap<>();
        response.put("conversation", conversation);
        response.put("messages", messages);

        return ResponseEntity.ok(response);
    }

    /**
     * Đóng cuộc trò chuyện
     */
    @PostMapping("/close/{conversationId}")
    public ResponseEntity<Map<String, String>> closeConversation(@PathVariable String conversationId) {
        ChatConversation conversation = conversationRepository.findByConversationId(conversationId)
                .orElse(null);

        if (conversation == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cuộc trò chuyện không tồn tại"));
        }

        chatService.closeConversation(conversation);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Cuộc trò chuyện đã được đóng");
        response.put("conversationId", conversationId);

        return ResponseEntity.ok(response);
    }
}

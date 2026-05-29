package com.example.webapp.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    // With Gmail SMTP, sender should be the authenticated account to avoid
    // rejection.
    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.mail.reply-to:support@ttcare.vn}")
    private String replyToEmail;

    @Value("${app.clinic.name:TT Care+}")
    private String clinicName;

    @Value("${app.clinic.address:Yen Nghia, Ha Dong, Ha Noi}")
    private String clinicAddress;

    @Value("${app.clinic.phone:0985081624}")
    private String clinicPhone;

    @Value("${app.clinic.email:support@ttcare.vn}")
    private String clinicEmail;

    @Value("${app.clinic.signature:TT Care+}")
    private String clinicSignature;

    public boolean sendRegistrationSuccessEmail(String toEmail, String customerName) {
        if (toEmail == null || !toEmail.contains("@")) {
            logger.warn("Skip sending registration email because recipient is not a valid email: {}", toEmail);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setReplyTo(replyToEmail);
            message.setTo(toEmail);
            message.setSubject("Xác nhận đăng ký thành công - TT Care+");

            String body = buildRegistrationEmailBody(customerName);
            message.setText(body);

            mailSender.send(message);
            logger.info("Registration email sent successfully to: {}", toEmail);
            return true;
        } catch (MailException e) {
            logger.error("SMTP send failed for {}. Message: {}", toEmail, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error when sending registration email to {}", toEmail, e);
            return false;
        }
    }

    public boolean sendAppointmentConfirmedEmail(
            String toEmail,
            String customerName,
            String doctorName,
            String roomName,
            LocalDate appointmentDate,
            LocalTime appointmentTime) {
        if (toEmail == null || !toEmail.contains("@")) {
            logger.warn("Skip sending confirmation email because recipient is not a valid email: {}", toEmail);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setReplyTo(replyToEmail);
            message.setTo(toEmail);
            message.setSubject("Lịch hẹn đã được bác sĩ xác nhận - TT Care+");

            String body = buildAppointmentConfirmedEmailBody(
                    customerName,
                    doctorName,
                    roomName,
                    appointmentDate,
                    appointmentTime);
            message.setText(body);

            mailSender.send(message);
            logger.info("Appointment confirmation email sent successfully to: {}", toEmail);
            return true;
        } catch (MailException e) {
            logger.error("SMTP send failed for {}. Message: {}", toEmail, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error when sending appointment confirmation email to {}", toEmail, e);
            return false;
        }
    }

    public boolean sendAppointmentCompletedEmail(
            String toEmail,
            String customerName,
            String doctorName,
            LocalDate appointmentDate) {
        if (toEmail == null || !toEmail.contains("@")) {
            logger.warn("Skip sending completed email because recipient is not a valid email: {}", toEmail);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setReplyTo(replyToEmail);
            message.setTo(toEmail);
            message.setSubject("Cảm ơn quý khách đã đến khám tại " + clinicName);
            message.setText(buildAppointmentCompletedEmailBody(customerName, doctorName, appointmentDate));
            mailSender.send(message);
            logger.info("Appointment completed email sent successfully to: {}", toEmail);
            return true;
        } catch (MailException e) {
            logger.error("SMTP send failed for {}. Message: {}", toEmail, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error when sending appointment completed email to {}", toEmail, e);
            return false;
        }
    }

    public boolean sendAppointmentMissedEmail(
            String toEmail,
            String customerName,
            String doctorName,
            LocalDate appointmentDate,
            LocalTime appointmentTime) {
        if (toEmail == null || !toEmail.contains("@")) {
            logger.warn("Skip sending missed email because recipient is not a valid email: {}", toEmail);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setReplyTo(replyToEmail);
            message.setTo(toEmail);
            message.setSubject("Lịch hẹn đã bị bỏ lỡ - TT Care+");
            message.setText(
                    buildAppointmentMissedEmailBody(customerName, doctorName, appointmentDate, appointmentTime));
            mailSender.send(message);
            logger.info("Appointment missed email sent successfully to: {}", toEmail);
            return true;
        } catch (MailException e) {
            logger.error("SMTP send failed for {}. Message: {}", toEmail, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error when sending appointment missed email to {}", toEmail, e);
            return false;
        }
    }

    public boolean sendAppointmentCancelledEmail(
            String toEmail,
            String customerName,
            String doctorName,
            LocalDate appointmentDate,
            LocalTime appointmentTime) {
        if (toEmail == null || !toEmail.contains("@")) {
            logger.warn("Skip sending cancelled email because recipient is not a valid email: {}", toEmail);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setReplyTo(replyToEmail);
            message.setTo(toEmail);
            message.setSubject("Lịch hẹn đã bị hủy - TT Care+");
            message.setText(
                    buildAppointmentCancelledEmailBody(customerName, doctorName, appointmentDate, appointmentTime));
            mailSender.send(message);
            logger.info("Appointment cancelled email sent successfully to: {}", toEmail);
            return true;
        } catch (MailException e) {
            logger.error("SMTP send failed for {}. Message: {}", toEmail, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error when sending appointment cancelled email to {}", toEmail, e);
            return false;
        }
    }

    private String buildRegistrationEmailBody(String customerName) {
        String displayName = customerName != null && !customerName.trim().isEmpty() ? customerName : "khách hàng";
        return "Kính gửi " + displayName + ",\n\n"
                + "Quý khách đã đăng ký tài khoản thành công trên hệ thống đặt lịch trực tuyến của " + clinicName
                + ".\n\n"
                + "Từ nay, Quý khách có thể:\n"
                + "- Đăng nhập và quản lý thông tin cá nhân.\n"
                + "- Đặt lịch khám nhanh chóng và thuận tiện.\n"
                + "- Theo dõi lịch sử khám và hồ sơ y tế.\n\n"
                + "Nếu Quý khách cần hỗ trợ, vui lòng liên hệ: " + clinicPhone + " hoặc email " + clinicEmail + ".\n\n"
                + "Trân trọng,\n"
                + clinicSignature + "\n" + clinicName;
    }

    private String buildAppointmentConfirmedEmailBody(
            String customerName,
            String doctorName,
            String roomName,
            LocalDate appointmentDate,
            LocalTime appointmentTime) {
        String displayCustomer = customerName != null && !customerName.trim().isEmpty() ? customerName : "Quý khách";
        String displayDoctor = doctorName != null && !doctorName.trim().isEmpty() ? doctorName : "Bác sĩ";
        String displayClinicName = roomName != null && !roomName.trim().isEmpty() ? roomName : clinicName;
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        String displayDate = appointmentDate != null ? appointmentDate.format(dateFmt) : "(chưa cập nhật)";
        String displayTime = appointmentTime != null ? appointmentTime.format(timeFmt) : "(chưa cập nhật)";

        return "Kính gửi " + displayCustomer + ",\n\n"
                + "Phòng khám " + clinicName + " trân trọng thông báo lịch hẹn của Quý khách đã được xác nhận.\n\n"
                + "Thông tin chi tiết như sau:\n"
                + "- Thời gian: " + displayDate + " lúc " + displayTime + "\n"
                + "- Bác sĩ phụ trách: " + displayDoctor + "\n"
                + "- Phòng/Đơn vị: " + displayClinicName + "\n"
                + "- Địa điểm: " + clinicAddress + "\n\n"
                + "Quý khách vui lòng có mặt trước ít nhất 10 phút để hoàn tất thủ tục hành chính."
                + " Nếu cần thay đổi hoặc hủy lịch, xin liên hệ số " + clinicPhone + " hoặc trả lời email này.\n\n"
                + "Trân trọng,\n"
                + clinicSignature + "\n" + clinicName;
    }

    private String buildAppointmentCompletedEmailBody(
            String customerName,
            String doctorName,
            LocalDate appointmentDate) {
        String displayCustomer = customerName != null && !customerName.trim().isEmpty() ? customerName : "Quý khách";
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String displayDate = appointmentDate != null ? appointmentDate.format(dateFmt) : "(chưa cập nhật)";

        return "Kính gửi " + displayCustomer + ",\n\n"
                + "Phòng khám " + clinicName + " xin chân thành cảm ơn Quý khách đã đến khám ngày " + displayDate
                + ".\n\n"
                + "Chúng tôi hy vọng Quý khách hài lòng với chất lượng dịch vụ. Nếu cần hỗ trợ thêm, xin vui lòng liên hệ: "
                + clinicPhone + " hoặc email " + clinicEmail + ".\n\n"
                + "Kính chúc Quý khách sức khỏe.\n\n"
                + "Trân trọng,\n"
                + clinicSignature + "\n" + clinicName;
    }

    private String buildAppointmentMissedEmailBody(
            String customerName,
            String doctorName,
            LocalDate appointmentDate,
            LocalTime appointmentTime) {
        String displayCustomer = customerName != null && !customerName.trim().isEmpty() ? customerName : "Quý khách";
        String displayDoctor = doctorName != null && !doctorName.trim().isEmpty() ? doctorName : "Bác sĩ";
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        String displayDate = appointmentDate != null ? appointmentDate.format(dateFmt) : "(chưa cập nhật)";
        String displayTime = appointmentTime != null ? appointmentTime.format(timeFmt) : "(chưa cập nhật)";

        return "Kính gửi " + displayCustomer + ",\n\n"
                + "Chúng tôi rất tiếc thông báo Quý khách đã bỏ lỡ lịch hẹn với " + displayDoctor + " vào ngày "
                + displayDate + " lúc " + displayTime + ".\n"
                + "Nếu Quý khách cần, chúng tôi sẵn sàng hỗ trợ đặt lại lịch phù hợp. Vui lòng truy cập hệ thống hoặc liên hệ phòng khám để được hỗ trợ.\n\n"
                + "Trân trọng,\n"
                + clinicSignature + "\n" + clinicName;
    }

    private String buildAppointmentCancelledEmailBody(
            String customerName,
            String doctorName,
            LocalDate appointmentDate,
            LocalTime appointmentTime) {
        String displayCustomer = customerName != null && !customerName.trim().isEmpty() ? customerName : "Quý khách";
        String displayDoctor = doctorName != null && !doctorName.trim().isEmpty() ? doctorName : "Bác sĩ";
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        String displayDate = appointmentDate != null ? appointmentDate.format(dateFmt) : "(chưa cập nhật)";
        String displayTime = appointmentTime != null ? appointmentTime.format(timeFmt) : "(chưa cập nhật)";

        return "Kính gửi " + displayCustomer + ",\n\n"
                + "Lịch hẹn với " + displayDoctor + " vào ngày " + displayDate + " lúc " + displayTime
                + " đã được hủy.\n"
                + "Nếu Quý khách cần hỗ trợ đặt lại lịch, xin vui lòng đăng nhập vào hệ thống hoặc liên hệ trực tiếp với phòng khám để được hướng dẫn.\n\n"
                + "Trân trọng,\n"
                + clinicSignature + "\n" + clinicName;
    }
}

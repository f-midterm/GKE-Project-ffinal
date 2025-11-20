package apartment.example.backend.service;

import apartment.example.backend.entity.Invoice;
import apartment.example.backend.entity.Lease;
import apartment.example.backend.entity.Payment;
import apartment.example.backend.entity.Tenant;
import apartment.example.backend.entity.Unit;
import apartment.example.backend.entity.enums.PaymentType;
import apartment.example.backend.repository.InvoiceRepository;
import apartment.example.backend.repository.PaymentRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PdfService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
    
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    /**
     * Generate Invoice PDF for billing
     * 
     * @param invoice Invoice entity with payment line items
     * @return PDF as byte array
     */
    public byte[] generateInvoicePdf(Invoice invoice) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            
            // Set A4 page size
            pdfDoc.setDefaultPageSize(com.itextpdf.kernel.geom.PageSize.A4);
            
            Document document = new Document(pdfDoc);
            
            // Set proper margins for A4
            document.setMargins(50, 50, 50, 50);
            
            // Fetch payments for this invoice (handle lazy loading)
            List<Payment> payments = paymentRepository.findByInvoiceId(invoice.getId());
            log.info("Found {} payments for invoice ID: {}", payments.size(), invoice.getId());
            
            Lease lease = invoice.getLease();
            Tenant tenant = lease.getTenant();
            Unit unit = lease.getUnit();
            
            // ============================================
            // HEADER - Invoice Title
            // ============================================
            Paragraph title = new Paragraph("INVOICE")
                    .setFontSize(24)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5);
            document.add(title);
            
            Paragraph subtitle = new Paragraph("BeLiv Apartment")
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(subtitle);
            
            // ============================================
            // Invoice Information
            // ============================================
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth()
                    .setMarginBottom(20);
            
            infoTable.addCell(new Cell().add(new Paragraph("Invoice Number:").setBold().setFontSize(10)).setBorder(null));
            infoTable.addCell(new Cell().add(new Paragraph(invoice.getInvoiceNumber()).setFontSize(10)).setBorder(null));
            
            infoTable.addCell(new Cell().add(new Paragraph("Invoice Date:").setBold().setFontSize(10)).setBorder(null));
            infoTable.addCell(new Cell().add(new Paragraph(invoice.getInvoiceDate().format(DATE_FORMATTER)).setFontSize(10)).setBorder(null));
            
            infoTable.addCell(new Cell().add(new Paragraph("Due Date:").setBold().setFontSize(10)).setBorder(null));
            infoTable.addCell(new Cell().add(new Paragraph(invoice.getDueDate().format(DATE_FORMATTER)).setFontSize(10)).setBorder(null));
            
            document.add(infoTable);
            
            // ============================================
            // Bill To Section
            // ============================================
            document.add(new Paragraph("BILL TO:").setBold().setFontSize(12).setMarginBottom(5));
            
            document.add(new Paragraph(tenant.getFirstName() + " " + tenant.getLastName())
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(2));
            
            document.add(new Paragraph("Unit: Si " + unit.getRoomNumber())
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(2));
            
            document.add(new Paragraph("Phone: " + tenant.getPhone())
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(2));
            
            document.add(new Paragraph("Email: " + tenant.getEmail())
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(20));
            
            // ============================================
            // Payment Items Table
            // ============================================
            Table itemsTable = new Table(UnitValue.createPercentArray(new float[]{3, 2, 2}))
                    .useAllAvailableWidth()
                    .setMarginBottom(20);
            
            itemsTable.addHeaderCell(createHeaderCell("Description"));
            itemsTable.addHeaderCell(createHeaderCell("Receipt Number"));
            itemsTable.addHeaderCell(createHeaderCell("Amount"));
            
            BigDecimal total = BigDecimal.ZERO;
            
            // Use fetched payments list
            if (payments != null && !payments.isEmpty()) {
                for (Payment payment : payments) {
                    itemsTable.addCell(new Cell().add(new Paragraph(getPaymentDescription(payment.getPaymentType())).setFontSize(10)));
                    String receiptNum = payment.getReceiptNumber() != null ? payment.getReceiptNumber() : "-";
                    itemsTable.addCell(new Cell().add(new Paragraph(receiptNum).setFontSize(10)));
                    itemsTable.addCell(new Cell()
                            .add(new Paragraph(String.format("%.2f Baht", payment.getAmount()))
                            .setFontSize(10))
                            .setTextAlignment(TextAlignment.RIGHT));
                    total = total.add(payment.getAmount());
                }
            } else {
                // If no payments found, use invoice total amount
                log.warn("No payments found for invoice ID: {}, using invoice notes as description", invoice.getId());
                String description = invoice.getNotes() != null ? invoice.getNotes() : "Payment";
                itemsTable.addCell(new Cell().add(new Paragraph(description).setFontSize(10)));
                itemsTable.addCell(new Cell().add(new Paragraph("-").setFontSize(10)));
                itemsTable.addCell(new Cell()
                        .add(new Paragraph(String.format("%.2f Baht", invoice.getTotalAmount()))
                        .setFontSize(10))
                        .setTextAlignment(TextAlignment.RIGHT));
                total = invoice.getTotalAmount();
            }
            
            document.add(itemsTable);
            
            // ============================================
            // Total Section
            // ============================================
            Table totalTable = new Table(UnitValue.createPercentArray(new float[]{3, 2}))
                    .useAllAvailableWidth()
                    .setMarginBottom(30);
            
            totalTable.addCell(new Cell()
                    .add(new Paragraph("TOTAL AMOUNT DUE").setBold().setFontSize(12))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBorder(null));
            
            totalTable.addCell(new Cell()
                    .add(new Paragraph(String.format("%.2f Baht", total)).setBold().setFontSize(12))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBorder(null));
            
            document.add(totalTable);
            
            // ============================================
            // Payment Instructions
            // ============================================
            document.add(new Paragraph("Payment Instructions:").setBold().setFontSize(11).setMarginBottom(10));
            
            document.add(new Paragraph("• Payment is due on the 1st day of each month")
                    .setFontSize(9)
                    .setMarginLeft(20)
                    .setMarginBottom(5));
            
            document.add(new Paragraph("• Grace period: 7 days from due date")
                    .setFontSize(9)
                    .setMarginLeft(20)
                    .setMarginBottom(5));
            
            document.add(new Paragraph("• Late payment charges apply after grace period")
                    .setFontSize(9)
                    .setMarginLeft(20)
                    .setMarginBottom(20));
            
            // ============================================
            // Footer
            // ============================================
            Paragraph footer = new Paragraph("Thank you for your payment. Please keep this invoice for your records.")
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30)
                    .setItalic();
            document.add(footer);
            
            document.close();
            
            log.info("Invoice PDF generated successfully for invoice ID: {}", invoice.getId());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error generating Invoice PDF for invoice ID: {}", invoice.getId(), e);
            throw new RuntimeException("Failed to generate Invoice PDF", e);
        }
    }
    
    /**
     * Generate Receipt PDF for paid invoices
     * 
     * @param invoice Invoice entity (must be PAID status)
     * @return PDF as byte array
     */
    public byte[] generateReceiptPdf(Invoice invoice) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            
            pdfDoc.setDefaultPageSize(com.itextpdf.kernel.geom.PageSize.A4);
            Document document = new Document(pdfDoc);
            document.setMargins(50, 50, 50, 50);
            
            // Fetch payments for this invoice
            List<Payment> payments = paymentRepository.findByInvoiceId(invoice.getId());
            
            Lease lease = invoice.getLease();
            Tenant tenant = lease.getTenant();
            Unit unit = lease.getUnit();
            
            // ============================================
            // HEADER - Receipt Title
            // ============================================
            Paragraph title = new Paragraph("RECEIPT")
                    .setFontSize(24)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5);
            document.add(title);
            
            Paragraph subtitle = new Paragraph("BeLiv Apartment")
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(subtitle);
            
            // ============================================
            // Receipt Information
            // ============================================
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth()
                    .setMarginBottom(20);
            
            infoTable.addCell(new Cell().add(new Paragraph("Receipt Number:").setBold().setFontSize(10)).setBorder(null));
            infoTable.addCell(new Cell().add(new Paragraph("RECEIPT-" + invoice.getInvoiceNumber()).setFontSize(10)).setBorder(null));
            
            infoTable.addCell(new Cell().add(new Paragraph("Invoice Number:").setBold().setFontSize(10)).setBorder(null));
            infoTable.addCell(new Cell().add(new Paragraph(invoice.getInvoiceNumber()).setFontSize(10)).setBorder(null));
            
            infoTable.addCell(new Cell().add(new Paragraph("Payment Date:").setBold().setFontSize(10)).setBorder(null));
            infoTable.addCell(new Cell().add(new Paragraph(invoice.getVerifiedAt() != null ? 
                    invoice.getVerifiedAt().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")) :
                    LocalDate.now().format(DATE_FORMATTER)).setFontSize(10)).setBorder(null));
            
            document.add(infoTable);
            
            // ============================================
            // Received From Section
            // ============================================
            document.add(new Paragraph("RECEIVED FROM:").setBold().setFontSize(12).setMarginBottom(5));
            
            document.add(new Paragraph(tenant.getFirstName() + " " + tenant.getLastName())
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(2));
            
            document.add(new Paragraph("Unit: " + unit.getRoomNumber())
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(2));
            
            document.add(new Paragraph("Phone: " + tenant.getPhone())
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(20));
            
            // ============================================
            // Payment Items Table
            // ============================================
            Table itemsTable = new Table(UnitValue.createPercentArray(new float[]{3, 2}))
                    .useAllAvailableWidth()
                    .setMarginBottom(20);
            
            itemsTable.addHeaderCell(createHeaderCell("Description"));
            itemsTable.addHeaderCell(createHeaderCell("Amount Paid"));
            
            BigDecimal total = BigDecimal.ZERO;
            
            if (payments != null && !payments.isEmpty()) {
                for (Payment payment : payments) {
                    itemsTable.addCell(new Cell().add(new Paragraph(getPaymentDescription(payment.getPaymentType())).setFontSize(10)));
                    itemsTable.addCell(new Cell()
                            .add(new Paragraph(String.format("%.2f Baht", payment.getAmount()))
                            .setFontSize(10))
                            .setTextAlignment(TextAlignment.RIGHT));
                    total = total.add(payment.getAmount());
                }
            } else {
                String description = invoice.getNotes() != null ? invoice.getNotes() : "Payment";
                itemsTable.addCell(new Cell().add(new Paragraph(description).setFontSize(10)));
                itemsTable.addCell(new Cell()
                        .add(new Paragraph(String.format("%.2f Baht", invoice.getTotalAmount()))
                        .setFontSize(10))
                        .setTextAlignment(TextAlignment.RIGHT));
                total = invoice.getTotalAmount();
            }
            
            document.add(itemsTable);
            
            // ============================================
            // Total Section
            // ============================================
            Table totalTable = new Table(UnitValue.createPercentArray(new float[]{3, 2}))
                    .useAllAvailableWidth()
                    .setMarginBottom(30);
            
            totalTable.addCell(new Cell()
                    .add(new Paragraph("TOTAL AMOUNT PAID").setBold().setFontSize(12))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBorder(null));
            
            totalTable.addCell(new Cell()
                    .add(new Paragraph(String.format("%.2f Baht", total)).setBold().setFontSize(12))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBorder(null));
            
            document.add(totalTable);
            
            // ============================================
            // Payment Status
            // ============================================
            document.add(new Paragraph("Payment Status: PAID")
                    .setBold()
                    .setFontSize(11)
                    .setFontColor(new DeviceRgb(34, 139, 34))
                    .setMarginBottom(20));
            
            // ============================================
            // Footer
            // ============================================
            Paragraph footer = new Paragraph("Thank you for your payment. This receipt is proof of payment.")
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30)
                    .setItalic();
            document.add(footer);
            
            document.close();
            
            log.info("Receipt PDF generated successfully for invoice ID: {}", invoice.getId());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error generating Receipt PDF for invoice ID: {}", invoice.getId(), e);
            throw new RuntimeException("Failed to generate Receipt PDF", e);
        }
    }
    
    /**
     * Generate Formal Lease Agreement PDF
     * 
     * @param lease Lease entity with tenant and unit information
     * @return PDF as byte array
     */
    public byte[] generateLeaseAgreementPdf(Lease lease) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            
            pdfDoc.setDefaultPageSize(com.itextpdf.kernel.geom.PageSize.A4);
            Document document = new Document(pdfDoc);
            document.setMargins(50, 50, 50, 50);

            Tenant tenant = lease.getTenant();
            Unit unit = lease.getUnit();

            // ============================================
            // HEADER
            // ============================================
            Paragraph title = new Paragraph("RESIDENTIAL LEASE AGREEMENT")
                    .setFontSize(18)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5);
            document.add(title);

            Paragraph refNumber = new Paragraph("Agreement No: LA-" + lease.getId())
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(25);
            document.add(refNumber);

            // ============================================
            // PREAMBLE
            // ============================================
            document.add(new Paragraph("This Lease Agreement (\"Agreement\") is entered into and effective as of " 
                    + lease.getStartDate().format(DATE_FORMATTER) + ".")
                    .setFontSize(10)
                    .setMarginBottom(15));

            // ============================================
            // PARTIES
            // ============================================
            Paragraph partiesTitle = new Paragraph("BETWEEN THE PARTIES:")
                    .setBold()
                    .setFontSize(11)
                    .setMarginBottom(10);
            document.add(partiesTitle);
            
            // Landlord section
            document.add(new Paragraph("LANDLORD:")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5));
            
            document.add(new Paragraph("BeLiv Apartment Management Co., Ltd.")
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(3));
            
            document.add(new Paragraph("Registered Address: 123 Sukhumvit Road, Khlong Toei, Bangkok 10110")
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(3));
            
            document.add(new Paragraph("Tax ID: 0123456789012")
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(15));
            
            // Tenant section
            document.add(new Paragraph("TENANT:")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5));
            
            document.add(new Paragraph("Name: " + tenant.getFirstName() + " " + tenant.getLastName())
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(3));
            
            document.add(new Paragraph("Identification Number: _________________")
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(3));
            
            document.add(new Paragraph("Contact Number: " + tenant.getPhone())
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(3));
            
            document.add(new Paragraph("Email Address: " + tenant.getEmail())
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(25));

            document.add(new Paragraph("Hereinafter referred to individually as \"Party\" and collectively as \"Parties\".")
                    .setFontSize(10)
                    .setItalic()
                    .setMarginBottom(25));

            // ============================================
            // RECITALS
            // ============================================
            Paragraph recitalsTitle = new Paragraph("RECITALS:")
                    .setBold()
                    .setFontSize(11)
                    .setMarginBottom(10);
            document.add(recitalsTitle);
            
            document.add(new Paragraph("WHEREAS, the Landlord is the lawful owner of certain residential premises; and")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5));
            
            document.add(new Paragraph("WHEREAS, the Tenant desires to lease the premises from the Landlord for residential purposes; and")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5));
            
            document.add(new Paragraph("WHEREAS, the Parties wish to set forth the terms and conditions of such lease arrangement.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(20));
            
            document.add(new Paragraph("NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, the Parties agree as follows:")
                    .setFontSize(10)
                    .setBold()
                    .setMarginBottom(25));

            // ============================================
            // ARTICLE 1: LEASED PREMISES
            // ============================================
            Paragraph article1 = new Paragraph("ARTICLE 1: LEASED PREMISES")
                    .setBold()
                    .setFontSize(12)
                    .setMarginBottom(10)
                    .setKeepWithNext(true);
            document.add(article1);
            
            Paragraph article1_1 = new Paragraph("1.1 Description of Property")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article1_1);
            
            Paragraph propertyDesc = new Paragraph("The Landlord hereby leases to the Tenant, and the Tenant hereby leases from the Landlord, the residential unit described as follows:")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(8)
                    .setKeepWithNext(true);
            document.add(propertyDesc);
            
            Table propertyTable = new Table(UnitValue.createPercentArray(new float[]{1.5f, 2.5f}))
                    .useAllAvailableWidth()
                    .setMarginLeft(40)
                    .setMarginBottom(20)
                    .setKeepTogether(true);
            
            addFormalDetailRow(propertyTable, "Unit Number:", "Room " + unit.getRoomNumber());
            addFormalDetailRow(propertyTable, "Unit Type:", unit.getUnitType());
            addFormalDetailRow(propertyTable, "Floor Level:", String.valueOf(unit.getFloor()));
            addFormalDetailRow(propertyTable, "Unit Size:", unit.getSizeSqm() + " square meters");
            addFormalDetailRow(propertyTable, "Building:", "BeLiv Apartment Complex");
            
            document.add(propertyTable);
            
            Paragraph article1_2 = new Paragraph("1.2 Use of Premises")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article1_2);
            
            document.add(new Paragraph("The leased premises shall be used exclusively for residential purposes and shall not be used for any commercial, business, or illegal activities without prior written consent from the Landlord.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(25));

            // ============================================
            // ARTICLE 2: TERM OF LEASE
            // ============================================
            Paragraph article2 = new Paragraph("ARTICLE 2: TERM OF LEASE")
                    .setBold()
                    .setFontSize(12)
                    .setMarginBottom(10)
                    .setKeepWithNext(true);
            document.add(article2);
            
            Paragraph article2_1 = new Paragraph("2.1 Lease Period")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article2_1);
            
            document.add(new Paragraph("The term of this lease shall commence on " 
                    + lease.getStartDate().format(DATE_FORMATTER) 
                    + " and shall terminate on " 
                    + lease.getEndDate().format(DATE_FORMATTER) 
                    + ", unless earlier terminated in accordance with the provisions of this Agreement.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(15));
            
            Paragraph article2_2 = new Paragraph("2.2 Renewal")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article2_2);
            
            document.add(new Paragraph("This lease may be renewed upon mutual written agreement of both Parties at least thirty (30) days prior to the expiration date. Terms of renewal, including any rent adjustment, shall be negotiated in good faith between the Parties.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(25));

            // ============================================
            // ARTICLE 3: RENT AND PAYMENT
            // ============================================
            Paragraph article3 = new Paragraph("ARTICLE 3: RENT AND PAYMENT TERMS")
                    .setBold()
                    .setFontSize(12)
                    .setMarginBottom(10)
                    .setKeepWithNext(true);
            document.add(article3);
            
            Paragraph article3_1 = new Paragraph("3.1 Monthly Rent")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article3_1);
            
            String monthlyRent = lease.getRentAmount() != null 
                ? String.format("%.2f", lease.getRentAmount().doubleValue())
                : "___________";
            
            document.add(new Paragraph("The Tenant agrees to pay the Landlord a monthly rent of " 
                    + monthlyRent + " Thai Baht (THB " + monthlyRent + ") for the leased premises.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(15));
            
            Paragraph article3_2 = new Paragraph("3.2 Security Deposit")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article3_2);
            
            String securityDeposit = lease.getSecurityDeposit() != null
                ? String.format("%.2f", lease.getSecurityDeposit().doubleValue())
                : "___________";
            
            document.add(new Paragraph("The Tenant has paid a security deposit of " 
                    + securityDeposit + " Thai Baht (THB " + securityDeposit 
                    + ") to the Landlord upon execution of this Agreement. This deposit shall be held as security for the faithful performance of the Tenant's obligations and shall be refunded within thirty (30) days of lease termination, subject to any deductions for damages or unpaid obligations.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(15));
            
            Paragraph article3_3 = new Paragraph("3.3 Payment Schedule")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article3_3);
            
            document.add(new Paragraph("Rent shall be due and payable on or before the first (1st) day of each calendar month. Payment shall be made via bank transfer, cash, or check to the account specified by the Landlord.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(15));
            
            Paragraph article3_4 = new Paragraph("3.4 Late Payment")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article3_4);
            
            document.add(new Paragraph("A grace period of seven (7) days from the due date shall be provided. If rent remains unpaid after the grace period, a late fee of 200 Thai Baht per day shall be applied. Continued non-payment may result in lease termination as provided in Article 7.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(25));

            // ============================================
            // ARTICLE 4: UTILITIES AND SERVICES
            // ============================================
            Paragraph article4 = new Paragraph("ARTICLE 4: UTILITIES AND SERVICES")
                    .setBold()
                    .setFontSize(12)
                    .setMarginBottom(10)
                    .setKeepWithNext(true);
            document.add(article4);
            
            Paragraph article4_1 = new Paragraph("4.1 Tenant's Responsibility")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article4_1);
            
            document.add(new Paragraph("The Tenant shall be responsible for and shall pay all charges for the following utilities consumed at the leased premises:")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(8));
            
            document.add(new Paragraph("(a) Electricity charges as per actual consumption recorded by meter")
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(3));
            
            document.add(new Paragraph("(b) Water charges as per actual consumption recorded by meter")
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(3));
            
            document.add(new Paragraph("(c) Internet and cable television services (if applicable)")
                    .setFontSize(10)
                    .setMarginLeft(40)
                    .setMarginBottom(15));
            
            Paragraph article4_2 = new Paragraph("4.2 Landlord's Responsibility")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article4_2);
            
            document.add(new Paragraph("The Landlord shall maintain common area utilities, building maintenance, and provide access to shared facilities as part of the residential services.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(25));

            // ============================================
            // ARTICLE 5: TENANT OBLIGATIONS
            // ============================================
            Paragraph article5 = new Paragraph("ARTICLE 5: TENANT OBLIGATIONS AND COVENANTS")
                    .setBold()
                    .setFontSize(12)
                    .setMarginBottom(10)
                    .setKeepWithNext(true);
            document.add(article5);
            
            Paragraph article5Intro = new Paragraph("The Tenant covenants and agrees to:")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(8)
                    .setKeepWithNext(true);
            document.add(article5Intro);
            
            String[] obligations = {
                "Maintain the leased premises in a clean, safe, and sanitary condition at all times",
                "Use the premises in a careful and lawful manner and comply with all applicable laws and regulations",
                "Not make any alterations, modifications, or improvements to the premises without prior written consent",
                "Not cause or permit any damage to the premises or common areas",
                "Not engage in any activity that creates excessive noise or disturbance to other residents",
                "Comply with all building rules, regulations, and policies established by the Landlord",
                "Allow the Landlord reasonable access to the premises for inspections and repairs upon 24-hour notice",
                "Not sublease or assign this lease without the express written consent of the Landlord",
                "Promptly report any maintenance issues or damages to the Landlord",
                "Return the premises in the same condition as received, ordinary wear and tear excepted"
            };
            
            for (int i = 0; i < obligations.length; i++) {
                document.add(new Paragraph("(" + (char)('a' + i) + ") " + obligations[i])
                        .setFontSize(10)
                        .setMarginLeft(40)
                        .setMarginBottom(3));
            }
            
            document.add(new Paragraph("").setMarginBottom(20));

            // ============================================
            // ARTICLE 6: LANDLORD OBLIGATIONS
            // ============================================
            Paragraph article6 = new Paragraph("ARTICLE 6: LANDLORD OBLIGATIONS")
                    .setBold()
                    .setFontSize(12)
                    .setMarginBottom(10)
                    .setKeepWithNext(true);
            document.add(article6);
            
            Paragraph article6Intro = new Paragraph("The Landlord covenants and agrees to:")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(8)
                    .setKeepWithNext(true);
            document.add(article6Intro);
            
            String[] landlordObligations = {
                "Provide the Tenant with quiet enjoyment of the premises",
                "Maintain the structural integrity of the building and common areas",
                "Ensure all building systems (plumbing, electrical, HVAC) are in working order",
                "Address maintenance requests in a timely manner",
                "Comply with all applicable housing and safety regulations"
            };
            
            for (int i = 0; i < landlordObligations.length; i++) {
                document.add(new Paragraph("(" + (char)('a' + i) + ") " + landlordObligations[i])
                        .setFontSize(10)
                        .setMarginLeft(40)
                        .setMarginBottom(3));
            }
            
            document.add(new Paragraph("").setMarginBottom(20));

            // ============================================
            // ARTICLE 7: TERMINATION
            // ============================================
            Paragraph article7 = new Paragraph("ARTICLE 7: TERMINATION")
                    .setBold()
                    .setFontSize(12)
                    .setMarginBottom(10)
                    .setKeepWithNext(true);
            document.add(article7);
            
            Paragraph article7_1 = new Paragraph("7.1 Natural Expiration")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article7_1);
            
            document.add(new Paragraph("This Agreement shall automatically terminate on " 
                    + lease.getEndDate().format(DATE_FORMATTER) 
                    + " without the need for further notice from either Party.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(15));
            
            Paragraph article7_2 = new Paragraph("7.2 Early Termination by Tenant")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article7_2);
            
            document.add(new Paragraph("The Tenant may terminate this Agreement prior to the expiration date by providing written notice to the Landlord at least thirty (30) days in advance. Early termination may result in forfeiture of the security deposit or payment of remaining rent, as determined by the Landlord.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(15));
            
            Paragraph article7_3 = new Paragraph("7.3 Termination for Default")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article7_3);
            
            document.add(new Paragraph("Either Party may terminate this Agreement immediately upon written notice if the other Party materially breaches any provision of this Agreement and fails to cure such breach within fifteen (15) days of written notice.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(25));

            // ============================================
            // ARTICLE 8: MISCELLANEOUS
            // ============================================
            Paragraph article8 = new Paragraph("ARTICLE 8: GENERAL PROVISIONS")
                    .setBold()
                    .setFontSize(12)
                    .setMarginBottom(10)
                    .setKeepWithNext(true);
            document.add(article8);
            
            Paragraph article8_1 = new Paragraph("8.1 Entire Agreement")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article8_1);
            
            document.add(new Paragraph("This Agreement constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, or agreements, whether written or oral.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(15));
            
            Paragraph article8_2 = new Paragraph("8.2 Amendments")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article8_2);
            
            document.add(new Paragraph("No amendment or modification of this Agreement shall be valid unless made in writing and signed by both Parties.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(15));
            
            Paragraph article8_3 = new Paragraph("8.3 Governing Law")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article8_3);
            
            document.add(new Paragraph("This Agreement shall be governed by and construed in accordance with the laws of the Kingdom of Thailand.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(15));
            
            Paragraph article8_4 = new Paragraph("8.4 Severability")
                    .setBold()
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(5)
                    .setKeepWithNext(true);
            document.add(article8_4);
            
            document.add(new Paragraph("If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.")
                    .setFontSize(10)
                    .setMarginLeft(20)
                    .setMarginBottom(25));

            // ============================================
            // SIGNATURE SECTION
            // ============================================
            Paragraph signatureIntro = new Paragraph("IN WITNESS WHEREOF, the Parties have executed this Lease Agreement as of the date first written above.")
                    .setFontSize(10)
                    .setBold()
                    .setMarginTop(30)
                    .setMarginBottom(30)
                    .setKeepWithNext(true);
            document.add(signatureIntro);
            
            Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth()
                    .setMarginTop(20);
            
            Cell landlordCell = new Cell()
                    .add(new Paragraph("LANDLORD:").setBold().setFontSize(10).setMarginBottom(20))
                    .add(new Paragraph("_______________________________"))
                    .add(new Paragraph("Authorized Signature").setFontSize(9).setMarginTop(3))
                    .add(new Paragraph("BeLiv Apartment Management Co., Ltd.").setFontSize(9).setMarginTop(3))
                    .add(new Paragraph("Date: _______________________").setFontSize(9).setMarginTop(15))
                    .setBorder(null)
                    .setPaddingRight(20);
            
            Cell tenantCell = new Cell()
                    .add(new Paragraph("TENANT:").setBold().setFontSize(10).setMarginBottom(20))
                    .add(new Paragraph("_______________________________"))
                    .add(new Paragraph("Signature").setFontSize(9).setMarginTop(3))
                    .add(new Paragraph(tenant.getFirstName() + " " + tenant.getLastName()).setFontSize(9).setMarginTop(3))
                    .add(new Paragraph("Date: _______________________").setFontSize(9).setMarginTop(15))
                    .setBorder(null)
                    .setPaddingLeft(20);
            
            signatureTable.addCell(landlordCell);
            signatureTable.addCell(tenantCell);
            
            document.add(signatureTable);

            // ============================================
            // WITNESS SECTION (Optional)
            // ============================================
            Paragraph witnessTitle = new Paragraph("WITNESSES:")
                    .setBold()
                    .setFontSize(10)
                    .setMarginTop(40)
                    .setMarginBottom(20)
                    .setKeepWithNext(true);
            document.add(witnessTitle);
            
            Table witnessTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth();
            
            Cell witness1 = new Cell()
                    .add(new Paragraph("_______________________________"))
                    .add(new Paragraph("Witness 1 Signature").setFontSize(9).setMarginTop(3))
                    .add(new Paragraph("Name: _______________________").setFontSize(9).setMarginTop(10))
                    .add(new Paragraph("Date: _______________________").setFontSize(9).setMarginTop(5))
                    .setBorder(null)
                    .setPaddingRight(20);
            
            Cell witness2 = new Cell()
                    .add(new Paragraph("_______________________________"))
                    .add(new Paragraph("Witness 2 Signature").setFontSize(9).setMarginTop(3))
                    .add(new Paragraph("Name: _______________________").setFontSize(9).setMarginTop(10))
                    .add(new Paragraph("Date: _______________________").setFontSize(9).setMarginTop(5))
                    .setBorder(null)
                    .setPaddingLeft(20);
            
            witnessTable.addCell(witness1);
            witnessTable.addCell(witness2);
            
            document.add(witnessTable);

            // ============================================
            // FOOTER
            // ============================================
            Paragraph footer = new Paragraph("This Residential Lease Agreement is a legally binding contract. Both Parties should retain a signed copy for their records.")
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30)
                    .setItalic()
                    .setFontColor(ColorConstants.DARK_GRAY);
            document.add(footer);

            document.close();
            
            log.info("Formal Lease Agreement PDF generated successfully for lease ID: {}", lease.getId());
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Error generating Lease Agreement PDF for lease ID: {}", lease.getId(), e);
            throw new RuntimeException("Failed to generate Lease Agreement PDF", e);
        }
    }

    // Helper method for creating formal table rows
    private void addFormalDetailRow(Table table, String label, String value) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setBold().setFontSize(9))
                .setBorder(null)
                .setPaddingBottom(5)
                .setPaddingTop(5);
        
        Cell valueCell = new Cell()
                .add(new Paragraph(value).setFontSize(9))
                .setBorder(null)
                .setPaddingBottom(5)
                .setPaddingTop(5);
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addDetailRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold().setFontSize(10)));
        table.addCell(new Cell().add(new Paragraph(value).setFontSize(10)));
    }

    private Cell createHeaderCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setBold())
                .setBackgroundColor(new DeviceRgb(240, 240, 240))
                .setTextAlignment(TextAlignment.CENTER);
    }

    private void addAmountRow(Table table, String description, Double amount) {
        table.addCell(new Cell().add(new Paragraph(description)));
        
        String amountText = amount != null ? String.format("%.2f Baht", amount) : "";
        table.addCell(new Cell()
                .add(new Paragraph(amountText))
                .setTextAlignment(TextAlignment.RIGHT));
    }
    
    private String getPaymentDescription(PaymentType paymentType) {
        switch (paymentType) {
            case RENT:
                return "Monthly Rent";
            case ELECTRICITY:
                return "Electricity Bill";
            case WATER:
                return "Water Bill";
            case MAINTENANCE:
                return "Maintenance Fee";
            case SECURITY_DEPOSIT:
                return "Security Deposit";
            default:
                return "Other Payment";
        }
    }
}

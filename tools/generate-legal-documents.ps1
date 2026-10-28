# Generates the Pteas Camera Privacy Policy and Terms of Use as Word documents.
# The supplied KEH Construction document was used as a content reference only.
# Irrelevant construction, recruitment, account, cookie, analytics and payment
# provisions are intentionally excluded from the Pteas Camera documents.

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot 'documents'
$sourceReference = 'C:\Users\ROG\OneDrive\Documents\Privacy KEH construction.docx'

if (-not (Test-Path -LiteralPath $sourceReference -PathType Leaf)) {
    throw "The supplied reference document was not found: $sourceReference"
}

if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

function Get-WordColor {
    param(
        [Parameter(Mandatory)][int]$Red,
        [Parameter(Mandatory)][int]$Green,
        [Parameter(Mandatory)][int]$Blue
    )

    return $Red + ($Green * 256) + ($Blue * 65536)
}

$accentRed = Get-WordColor -Red 217 -Green 35 -Blue 46
$textGray = Get-WordColor -Red 78 -Green 85 -Blue 96
$lightGray = Get-WordColor -Red 130 -Green 140 -Blue 153

function Set-DocumentStyles {
    param([Parameter(Mandatory)]$Document)

    # Letter portrait page with comfortable margins for sustained reading.
    $section = $Document.Sections.Item(1)
    $section.PageSetup.PageWidth = 612
    $section.PageSetup.PageHeight = 792
    $section.PageSetup.TopMargin = 61.2
    $section.PageSetup.BottomMargin = 61.2
    $section.PageSetup.LeftMargin = 64.8
    $section.PageSetup.RightMargin = 64.8
    $section.PageSetup.HeaderDistance = 28.8
    $section.PageSetup.FooterDistance = 28.8

    $normal = $Document.Styles.Item('Normal')
    $normal.Font.Name = 'Arial'
    $normal.Font.NameAscii = 'Arial'
    $normal.Font.NameOther = 'Arial'
    $normal.Font.Size = 11
    $normal.Font.Color = $textGray
    $normal.ParagraphFormat.SpaceAfter = 8
    $normal.ParagraphFormat.LineSpacingRule = 5
    $normal.ParagraphFormat.LineSpacing = 15.5
    $normal.ParagraphFormat.WidowControl = $true

    $title = $Document.Styles.Item('Title')
    $title.Font.Name = 'Arial'
    $title.Font.NameAscii = 'Arial'
    $title.Font.NameOther = 'Arial'
    $title.Font.Size = 27
    $title.Font.Bold = $true
    $title.Font.Color = 0
    $title.ParagraphFormat.SpaceBefore = 0
    $title.ParagraphFormat.SpaceAfter = 10
    $title.ParagraphFormat.KeepWithNext = $true

    $headingOne = $Document.Styles.Item('Heading 1')
    $headingOne.Font.Name = 'Arial'
    $headingOne.Font.NameAscii = 'Arial'
    $headingOne.Font.NameOther = 'Arial'
    $headingOne.Font.Size = 18
    $headingOne.Font.Bold = $true
    $headingOne.Font.Color = 0
    $headingOne.ParagraphFormat.SpaceBefore = 20
    $headingOne.ParagraphFormat.SpaceAfter = 9
    $headingOne.ParagraphFormat.KeepWithNext = $true
    $headingOne.ParagraphFormat.KeepTogether = $true

    $headingTwo = $Document.Styles.Item('Heading 2')
    $headingTwo.Font.Name = 'Arial'
    $headingTwo.Font.NameAscii = 'Arial'
    $headingTwo.Font.NameOther = 'Arial'
    $headingTwo.Font.Size = 12.5
    $headingTwo.Font.Bold = $true
    $headingTwo.Font.Color = 0
    $headingTwo.ParagraphFormat.SpaceBefore = 14
    $headingTwo.ParagraphFormat.SpaceAfter = 6
    $headingTwo.ParagraphFormat.KeepWithNext = $true

    $bullet = $Document.Styles.Item('List Bullet')
    $bullet.Font.Name = 'Arial'
    $bullet.Font.NameAscii = 'Arial'
    $bullet.Font.NameOther = 'Arial'
    $bullet.Font.Size = 11
    $bullet.Font.Color = $textGray
    $bullet.ParagraphFormat.LeftIndent = 21.6
    $bullet.ParagraphFormat.FirstLineIndent = -10.8
    $bullet.ParagraphFormat.SpaceAfter = 4
    $bullet.ParagraphFormat.LineSpacingRule = 5
    $bullet.ParagraphFormat.LineSpacing = 15
}

function Add-Paragraph {
    param(
        [Parameter(Mandatory)]$Selection,
        [Parameter(Mandatory)][string]$Text,
        [string]$Style = 'Normal'
    )

    $Selection.EndKey(6) | Out-Null
    $Selection.Style = $Style
    $Selection.Font.Reset()
    $Selection.TypeText($Text)
    $Selection.TypeParagraph()
}

function Add-BrandLabel {
    param([Parameter(Mandatory)]$Selection)

    $Selection.EndKey(6) | Out-Null
    $Selection.Style = 'Normal'
    $Selection.Font.Reset()
    $Selection.Font.Name = 'Arial'
    $Selection.Font.Size = 9
    $Selection.Font.Bold = $true
    $Selection.Font.Color = $accentRed
    $Selection.Font.Spacing = 1.2
    $Selection.TypeText('PTEAS CAMERA')
    $Selection.TypeParagraph()
    $Selection.Font.Reset()
}

function Add-Subtitle {
    param(
        [Parameter(Mandatory)]$Selection,
        [Parameter(Mandatory)][string]$Text
    )

    $Selection.EndKey(6) | Out-Null
    $Selection.Style = 'Normal'
    $Selection.Font.Reset()
    $Selection.Font.Name = 'Arial'
    $Selection.Font.Size = 13
    $Selection.Font.Color = $textGray
    $Selection.ParagraphFormat.SpaceAfter = 8
    $Selection.TypeText($Text)
    $Selection.TypeParagraph()
}

function Add-UpdatedDate {
    param([Parameter(Mandatory)]$Selection)

    $Selection.EndKey(6) | Out-Null
    $Selection.Style = 'Normal'
    $Selection.Font.Reset()
    $Selection.Font.Name = 'Arial'
    $Selection.Font.Size = 9
    $Selection.Font.Bold = $true
    $Selection.Font.Color = $lightGray
    $Selection.Font.Spacing = 0.8
    $Selection.TypeText('LAST UPDATED 13 OCTOBER 2026')
    $Selection.TypeParagraph()
}

function Add-BoldLeadParagraph {
    param(
        [Parameter(Mandatory)]$Selection,
        [Parameter(Mandatory)][string]$Lead,
        [Parameter(Mandatory)][string]$Text
    )

    $Selection.EndKey(6) | Out-Null
    $Selection.Style = 'Normal'
    $Selection.Font.Reset()
    $Selection.Font.Bold = $true
    $Selection.TypeText($Lead)
    $Selection.Font.Bold = $false
    $Selection.TypeText($Text)
    $Selection.TypeParagraph()
}

function Add-ContentsItem {
    param(
        [Parameter(Mandatory)]$Selection,
        [Parameter(Mandatory)][string]$Number,
        [Parameter(Mandatory)][string]$Label
    )

    $Selection.EndKey(6) | Out-Null
    $Selection.Style = 'Normal'
    $Selection.Font.Reset()
    $Selection.ParagraphFormat.SpaceAfter = 5
    $Selection.Font.Bold = $true
    $Selection.Font.Color = $accentRed
    $Selection.TypeText($Number)
    $Selection.Font.Bold = $false
    $Selection.Font.Color = $textGray
    $Selection.TypeText("    $Label")
    $Selection.TypeParagraph()
}

function Add-DocumentFooter {
    param(
        [Parameter(Mandatory)]$Document,
        [Parameter(Mandatory)][string]$DocumentLabel
    )

    $footer = $Document.Sections.Item(1).Footers.Item(1).Range
    $footer.Text = "Pteas Camera | $DocumentLabel | Page "
    $footer.Font.Name = 'Arial'
    $footer.Font.Size = 8.5
    $footer.Font.Color = $lightGray
    $footer.ParagraphFormat.Alignment = 1
    $footer.Collapse(0)
    $footer.Fields.Add($footer, 33) | Out-Null
}

function New-BaseDocument {
    param(
        [Parameter(Mandatory)]$Word,
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][string]$Subject
    )

    $document = $Word.Documents.Add()
    Set-DocumentStyles -Document $document
    $document.BuiltInDocumentProperties.Item('Title').Value = $Title
    $document.BuiltInDocumentProperties.Item('Subject').Value = $Subject
    $document.BuiltInDocumentProperties.Item('Company').Value = 'Pteas Camera'
    return $document
}

function New-PrivacyPolicyDocument {
    param(
        [Parameter(Mandatory)]$Word,
        [Parameter(Mandatory)][string]$OutputPath
    )

    $document = New-BaseDocument -Word $Word -Title 'Pteas Camera Privacy Policy' -Subject 'How Pteas Camera handles contact form information'
    $selection = $Word.Selection

    Add-BrandLabel -Selection $selection
    Add-Paragraph -Selection $selection -Text 'Pteas Camera Privacy Policy' -Style 'Title'
    Add-Subtitle -Selection $selection -Text 'How we handle information submitted through the contact form'
    Add-UpdatedDate -Selection $selection
    Add-Paragraph -Selection $selection -Text 'Pteas Camera respects your privacy. This policy explains how we handle the personal information that you choose to provide through the contact form on our informational website.'
    Add-BoldLeadParagraph -Selection $selection -Lead 'Current form status  ' -Text 'The demo contact form does not send messages to Pteas Camera or store form entries. If form submission is activated later, the collection and use described in this policy will apply.'

    Add-Paragraph -Selection $selection -Text 'Contents' -Style 'Heading 1'
    Add-ContentsItem -Selection $selection -Number '01' -Label 'Form Information We Collect'
    Add-ContentsItem -Selection $selection -Number '02' -Label 'How We Use Form Information'
    Add-ContentsItem -Selection $selection -Number '03' -Label 'When We Share Information'
    Add-ContentsItem -Selection $selection -Number '04' -Label 'Storage and Retention'
    Add-ContentsItem -Selection $selection -Number '05' -Label 'Data Security'
    Add-ContentsItem -Selection $selection -Number '06' -Label 'Your Choices'
    Add-ContentsItem -Selection $selection -Number '07' -Label 'Third Party Services'
    Add-ContentsItem -Selection $selection -Number '08' -Label 'Changes and Contact'
    $selection.InsertBreak(7)

    Add-Paragraph -Selection $selection -Text '1 Form Information We Collect' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'The contact form is the only place where Pteas Camera asks you to provide personal information through this website. The form includes:'
    @(
        'Your name',
        'Your phone number',
        'Your email address if you choose to provide it',
        'The topic of your inquiry',
        'Your message'
    ) | ForEach-Object { Add-Paragraph -Selection $selection -Text $_ -Style 'List Bullet' }
    Add-Paragraph -Selection $selection -Text 'Please do not include payment-card details, passwords, identity documents, medical information or other sensitive information in your message.'
    Add-Paragraph -Selection $selection -Text 'Information We Do Not Request' -Style 'Heading 2'
    Add-Paragraph -Selection $selection -Text 'Pteas Camera does not request account passwords, online-payment details, job applications, CVs, precise device location or social-media login information through this website.'

    Add-Paragraph -Selection $selection -Text '2 How We Use Form Information' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'If the contact form is activated, we will use the information you submit only to:'
    @(
        'Reply to your question',
        'Discuss product availability, new or pre-owned gear and compatibility',
        'Answer questions about repairs, cleaning or creator setups',
        'Help you prepare for a visit to the store',
        'Protect the form and respond to misuse when necessary'
    ) | ForEach-Object { Add-Paragraph -Selection $selection -Text $_ -Style 'List Bullet' }
    Add-Paragraph -Selection $selection -Text 'Submitting the form does not create an order, reservation, sale or service contract.'

    Add-Paragraph -Selection $selection -Text '3 When We Share Information' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'We do not sell, rent or trade form information. We may share it only with a service provider that helps deliver or host the form, when necessary to respond to your request, to comply with applicable law, or to protect the rights and safety of Pteas Camera and others.'
    Add-Paragraph -Selection $selection -Text 'Any service provider handling form information should use it only for the service it provides to Pteas Camera and apply reasonable safeguards.'

    Add-Paragraph -Selection $selection -Text '4 Storage and Retention' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'The current demo form does not send entries to a server or database controlled by Pteas Camera. If the form is activated, its privacy notice and this policy will be updated to identify how submissions are delivered and stored.'
    Add-Paragraph -Selection $selection -Text 'We will keep submitted information only for as long as reasonably needed to answer and follow up on your request, resolve a dispute or meet an applicable legal requirement. Information that is no longer needed will be deleted or securely disposed of.'

    Add-Paragraph -Selection $selection -Text '5 Data Security' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'When form collection is activated, Pteas Camera will use reasonable administrative and technical measures to protect submitted information against unauthorized access, loss, misuse or disclosure. No method of internet transmission or electronic storage can be guaranteed completely secure.'

    Add-Paragraph -Selection $selection -Text '6 Your Choices' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'You may ask us to explain what form information we hold about you, correct inaccurate information or delete information that is no longer needed. We may ask for enough information to verify that the request relates to you.'
    Add-Paragraph -Selection $selection -Text 'You may also choose not to use the form and contact the store by phone or in person.'

    Add-Paragraph -Selection $selection -Text '7 Third Party Services' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text "This website uses or links to third-party services, including Google Maps, Google Fonts and social-media platforms. These providers may process technical information such as your IP address, browser details or interaction with their service under their own privacy policies. That processing is controlled by the third party, not by Pteas Camera."
    Add-Paragraph -Selection $selection -Text "Opening an external link takes you away from this website. Review the provider's privacy information before sharing personal information with it."

    Add-Paragraph -Selection $selection -Text '8 Changes and Contact' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'We may update this Privacy Policy when the website, contact form or our information practices change. The updated date at the start of this document will show when the latest version took effect.'
    Add-Paragraph -Selection $selection -Text 'For a privacy question or request, call 012 345 678 or visit Pteas Camera at the location shown on the Contact page.'

    Add-DocumentFooter -Document $document -DocumentLabel 'Privacy Policy'
    $document.SaveAs2($OutputPath, 16)
    $document.Close($false)
}

function New-TermsDocument {
    param(
        [Parameter(Mandatory)]$Word,
        [Parameter(Mandatory)][string]$OutputPath
    )

    $document = New-BaseDocument -Word $Word -Title 'Pteas Camera Terms of Use' -Subject 'Conditions for using the Pteas Camera informational website'
    $selection = $Word.Selection

    Add-BrandLabel -Selection $selection
    Add-Paragraph -Selection $selection -Text 'Pteas Camera Terms of Use' -Style 'Title'
    Add-Subtitle -Selection $selection -Text 'Conditions for using the Pteas Camera informational website'
    Add-UpdatedDate -Selection $selection
    Add-Paragraph -Selection $selection -Text 'These Terms of Use apply when you browse the Pteas Camera website or use its contact form. By using the website, you agree to these terms. If you do not agree, please stop using the website.'
    Add-BoldLeadParagraph -Selection $selection -Lead 'Website purpose  ' -Text 'Pteas Camera is an informational website for a walk-in camera shop. Online orders, online payments and account registration are not available through this website.'

    Add-Paragraph -Selection $selection -Text 'Contents' -Style 'Heading 1'
    Add-ContentsItem -Selection $selection -Number '01' -Label 'Accepting These Terms'
    Add-ContentsItem -Selection $selection -Number '02' -Label 'Information and Store Purchases'
    Add-ContentsItem -Selection $selection -Number '03' -Label 'Products Prices and Availability'
    Add-ContentsItem -Selection $selection -Number '04' -Label 'Contact Form Submissions'
    Add-ContentsItem -Selection $selection -Number '05' -Label 'Acceptable Website Use'
    Add-ContentsItem -Selection $selection -Number '06' -Label 'Intellectual Property'
    Add-ContentsItem -Selection $selection -Number '07' -Label 'Third Party Services'
    Add-ContentsItem -Selection $selection -Number '08' -Label 'Responsibility Changes and Contact'
    $selection.InsertBreak(7)

    Add-Paragraph -Selection $selection -Text '1 Accepting These Terms' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'You may use this website only if you can lawfully agree to these terms. If you use the website for a business or another person, you confirm that you are authorized to act for them.'
    Add-Paragraph -Selection $selection -Text 'Our Privacy Policy explains how Pteas Camera handles information submitted through the contact form and forms part of these terms.'

    Add-Paragraph -Selection $selection -Text '2 Information and Store Purchases' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'The website introduces product categories, store services and general product information. Website content does not create an offer, sale, reservation, booking, warranty or service contract.'
    Add-Paragraph -Selection $selection -Text 'All purchases are completed in person. Product identity, condition, included accessories, compatibility, final price and any service terms must be confirmed with Pteas Camera before purchase.'

    Add-Paragraph -Selection $selection -Text '3 Products Prices and Availability' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'Product descriptions, specifications, photographs, prices and availability may change without notice. Images may show examples and may not represent the exact item currently available in the store.'
    Add-Paragraph -Selection $selection -Text 'New and pre-owned equipment may differ in condition, age, accessories and warranty coverage. Please contact or visit the store to confirm current information before relying on a listing.'

    Add-Paragraph -Selection $selection -Text '4 Contact Form Submissions' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'The current contact form is a demo and does not send messages or create a stored customer record. If form submission is activated, you must provide accurate information and submit only material that you are authorized to share.'
    Add-Paragraph -Selection $selection -Text 'A form submission is a request for information only. It does not guarantee stock, hold a product, confirm a repair, create an appointment or form a contract.'

    Add-Paragraph -Selection $selection -Text '5 Acceptable Website Use' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'You may use this website for lawful personal or business inquiries. You must not:'
    @(
        'Attempt to gain unauthorized access to the website or another system',
        "Introduce malicious code or interfere with the website's operation",
        'Use the contact form for spam, harassment, fraud or unlawful content',
        'Misrepresent your identity or submit information belonging to another person without permission',
        'Copy or exploit website content in violation of applicable rights'
    ) | ForEach-Object { Add-Paragraph -Selection $selection -Text $_ -Style 'List Bullet' }

    Add-Paragraph -Selection $selection -Text '6 Intellectual Property' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'The Pteas Camera name, logo, website design and original text and images belong to Pteas Camera or are used with permission. You may view the website for your own information, but you may not reproduce, publish, modify or use its content commercially without permission from the relevant rights holder.'
    Add-Paragraph -Selection $selection -Text 'Product names and trademarks belonging to manufacturers remain the property of their respective owners.'

    Add-Paragraph -Selection $selection -Text '7 Third Party Services' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'The website may display or link to Google Maps, Google Fonts and social-media platforms. These services are provided by third parties under their own terms and privacy policies. Pteas Camera does not control their availability, content or data practices.'

    Add-Paragraph -Selection $selection -Text '8 Responsibility Changes and Contact' -Style 'Heading 1'
    Add-Paragraph -Selection $selection -Text 'We make reasonable efforts to keep website information useful and current, but we do not guarantee that the website will always be available or free from errors. Nothing in these terms excludes rights or responsibilities that cannot be excluded under applicable law.'
    Add-Paragraph -Selection $selection -Text 'We may update these terms when the website or our practices change. The updated date at the start of this document will identify the latest version.'
    Add-Paragraph -Selection $selection -Text 'For questions, call 012 345 678 or visit the location shown on the Pteas Camera Contact page.'

    Add-DocumentFooter -Document $document -DocumentLabel 'Terms of Use'
    $document.SaveAs2($OutputPath, 16)
    $document.Close($false)
}

$privacyPath = Join-Path $outputDirectory 'Pteas Camera Privacy Policy.docx'
$termsPath = Join-Path $outputDirectory 'Pteas Camera Terms of Use.docx'

$word = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.ScreenUpdating = $false

    New-PrivacyPolicyDocument -Word $word -OutputPath $privacyPath
    New-TermsDocument -Word $word -OutputPath $termsPath
} finally {
    if ($word) {
        $word.Quit()
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Output $privacyPath
Write-Output $termsPath

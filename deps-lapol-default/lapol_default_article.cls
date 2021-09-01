%
% LaPoL's default Article CLASS Version 0.0.1
%
% Load BEFORE lapol_default.sty

%
% Class
%

%<--------------------------80 characters-------------------------------------->
%<------------------------------------------120 characters------------------------------------------------------------->

% Provide class course_notes_a
\ProvidesClass{lapol_default_article}[lapol_default_article]

% Warn on outdated commands
\RequirePackage[l2tabu,orthodox]{nag}

% ==============================================================================

% +--------------+ 
% | COMMENT HACK |
% +--------------+
%
% This is a workaround for an issue with TeXstudio. If you use TeXstudio for de
% -bugging LaPoL generated files, this may be of interest.
%
% TeXstudio doesn't recognize custom packages and classes loaded with
% \documentclass{} and \usepackage{} from the local directory.
%
% This "hack" allows you to trick TeXstudio into thinking you are using
% \import{} which makes TeXstudio load the commands defined in the file.
%
\usepackage{comment}           % Allow comments.
\excludecomment{mcommenthack}  % Define custom comment environment.
%
% Use \begin{mcomment_hack} \end{mcomment_hack} to write a comment
% This is useful to trick TeXstudio into importing a cls file properly.
%
% Example Usage:
% % Trick TeXstudio into loading the commands defined in this file.
% \begin{mcommenthack}
% \input{my_class.cls}
% \input{my_package.sty}
% \end{mcommenthack}

% ==============================================================================

% This class is based on KomaScript.

% parskip works for KomaScript classes: instead of indenting paragraphs, it adds
% a line skip between them.
%
% You may add "twocolumn" if you want the document to be laid out in two columns
\LoadClass[
 a4paper,
 %twocolumn,
 parskip=half,
 %headings=standardclasses
 ]{scrartcl} %scrartcl / scrreprt


% Latin Modern instead of Computer Modern
% Looks better (???)
\usepackage{lmodern}

% If you don't use Latin Modern, use this!
%\usepackage{fix-cm}

% If you want Serif fonts for Heading Titles
%\addtokomafont{disposition}{\rmfamily}


% Allow color in output
\usepackage{color}
\usepackage[svgnames]{xcolor}

\usepackage{tikz}

% Colored Boxes 
% https://tex.stackexchange.com/questions/2504/beamer-blocks-in-ordinary-article-style-document
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable,theorems,xparse}
\usetikzlibrary{shadings,shadows}

% Based on https://tex.stackexchange.com/questions/277777/block-quote-with-big-quotation-marks-in-margin
\newtcolorbox{lapoldefaultblockquote}{%
    enhanced jigsaw,
    colback=white,
    breakable,       % allow page breaks
    frame hidden,    % hide the default frame
    left=20pt,
    right=20pt,
    halign lower=right,
    lower separated=false,
    overlay  unbroken={%
        \node [scale=5,text=black,inner sep=0pt,] %
        at ([xshift=9pt,yshift=-0.8cm]frame.north west)%
        {\fontfamily{qcs}\color{gray!30!white}\itshape``}; %
        \node [scale=5,text=black,inner sep=0pt,] %
        at ([xshift=-12pt,yshift=0pt]frame.south east)%
        {\fontfamily{qcs}\color{gray!30!white}\itshape''}; %
    },
    overlay first={%
        \node [scale=5,text=black,inner sep=0pt,] %
        at ([xshift=9pt,yshift=-0.8cm]frame.north west)%
        {\fontfamily{qcs}\color{gray!30!white}\itshape``}; %
    },
    overlay middle={},
    overlay last={%
        \node [scale=5,text=black,inner sep=0pt,] %
        at ([xshift=-12pt,yshift=0pt]frame.south east)%
        {\fontfamily{qcs}\color{gray!30!white}\itshape''}; %
    },
    parbox=false, % paragraph skips obeyed within tcolorbox
}

% Instead of using the "parskip=half" setting for scrreprt, I alternatively may
% choose to use the indentfirst package. This way, all paragraphs will be
% indented (even the first one after a heading!)
\usepackage{indentfirst}

% Better encoding (Unicode input)
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}

% Proper hyphenation and translated elements (e.g "section")
\usepackage[english]{babel}

% Makes text look better (fewer hyphens at the end)
\usepackage{microtype}

% Ams packages
\usepackage{amsmath}
\usepackage{amsthm}
\usepackage{amssymb}

% Better/easier to use quotes (commands like \enquote{})
\usepackage{csquotes}

% Better tables
\usepackage{booktabs}

% \includegraphics
\usepackage{graphicx}

% Symbols like \degree
\usepackage{gensymb}

% Source code & Syntax Highlighting
\usepackage{listings}

% Allows customizing list labels 
%(see https://tex.stackexchange.com/questions/129951/enumerate-tag-using-the-alphabet-instead-of-numbers)
\usepackage{enumitem}

% To allow the warning sign
\usepackage{stackengine}
\usepackage{scalerel}

% Allow margin text
\usepackage{marginnote}

% url package is loaded by hyperref.
% Allow line breaking of urls at hyphens.
\PassOptionsToPackage{hyphens}{url}

% Allow hyperlinking. Also automatically adds PDF section markers.
% colorlinks=true, unsurpisingly, makes links colored (and removes the ugly
% box around them).
\usepackage[colorlinks=true]{hyperref}

% Allows some stretching of url in \url{} (from hyperref) to permit justifying
% text. Mostly to avoid Overfull/Underfull \hbox errors.
\Urlmuskip=0mu plus 5mu

% Headers
\usepackage[
headsepline, 
automark,
autooneside=false
]{scrlayer-scrpage}
\pagestyle{scrheadings}
\ihead{\leftmark}
\chead{}
\ohead{\ifstr{\leftmark}{\rightmark}{}{\rightmark}} 
% Add a right (i.e. section) mark only if it exists. This is so that if you have
% a chapter without a section, you don't get weird stuff. See 
% https://tex.stackexchange.com/questions/504068/headings-with-scrlayer-scrpage)

% Set the TOC depth to 4, which means paragraphs will be included.
%\setcounter{tocdepth}{4}

% Permits linking to the Table of Contents (TOC) (adds a target to the TOC)
\addtocontents{toc}{\protect\hypertarget{toc}{}}
% Adds TOC to PDF bookmarks
\addtocontents{toc}{\protect{\pdfbookmark[0]{\contentsname}{toc}}}

% Don't add extra space after period "ending sentence"
\frenchspacing

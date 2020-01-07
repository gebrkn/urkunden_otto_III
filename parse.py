import sys
import re
import json


def remove_ws(s):
    return re.sub(r'\s+', ' ', s.strip())


def setprop(doc, name, value):
    doc[name] = remove_ws(value)
    return ''


def make_doc(block):
    """Create a single json doc from a text block."""

    doc = {}

    # normalize whitespace within <...> marks

    block = re.sub(
        r'<([^>]+)>',
        lambda m: '<' + remove_ws(m.group(1)) + '>',
        block
    )

    # extract base tags

    block = re.sub(
        r'(num|cont|place|date)<([^>]+)>',
        lambda m: setprop(doc, m.group(1), m.group(2)),
        block
    )

    doc.setdefault('date', '-')
    doc.setdefault('place', '-')

    # remove excess whitespace, but keep new lines

    block = re.sub(r'\.\n[ \t]*([A-Z\d\[])', r'.~~~\1', block)
    block = remove_ws(block)
    block = re.sub(r'~~~', '\n', block)

    # extract pet/int

    s_int = set()
    s_pet = set()

    for k, v in re.findall(r'(petint|pet|int)<([^>]+)>', block):
        if k == 'petint':
            s_pet.add(v)
            s_int.add(v)
        elif k == 'pet':
            s_pet.add(v)
        elif k == 'int':
            s_int.add(v)

    doc['int'] = sorted(s_int)
    doc['pet'] = sorted(s_pet)

    block = block.replace('<', '{')
    block = block.replace('>', '}')

    doc['text'] = block

    return doc


def make_docs(text):
    """Parse the text into dicts.
    
    The text consist of docs, each doc starts with ">>number".
    In the doc body, the following tags are used:

        cont<...>   = document summary
        place<...>  =
        date<...>   =
        pet<...>    = petent
        int<...>    = intervenient
        petint<...> = petent+intervenient
    """

    text = re.sub(r' +\n', '\n', text)
    text = re.sub('—', '-', text)

    # replace >>>>N with num<N> and split by then

    text = re.sub(r'>+[ \t]*(\d+)', r'~~~num<\1>', text)
    blocks = text.split('~~~')

    docs = []

    for block in blocks:
        block = block.strip()
        if not block:
            continue
        docs.append(make_doc(block))

    return docs


def main(namelist, corpus):
    # read names.txt and convert it to a mapping 
    #   name -> normalized name

    names = {}

    with open(namelist) as fp:
        for s in fp.read().strip().splitlines():
            s = s.strip()
            if s:
                a, b = s.split('|')
                names[a.strip()] = b.strip()

    # convert the main corpus into a list of dicts

    with open(corpus) as fp:
        docs = make_docs(fp.read())

    # resolve name aliases

    for d in docs:
        d['pet'] = sorted(names[x] for x in d['pet'])
        d['int'] = sorted(names[x] for x in d['int'])

    # print as json

    print(json.dumps(docs, indent=4, sort_keys=True))


if __name__ == '__main__':
    # usage: parse.py <path-to-names-file> <path-to-corpus-file>
    main(sys.argv[1], sys.argv[2])

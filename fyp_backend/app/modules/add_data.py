# Note: consider adding blob into gcp of chroma persist dir cause ain no body wanna give you free stuff
# Imports
import os
from langchain_unstructured import UnstructuredLoader
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai.embeddings import OpenAIEmbeddings 
from langchain_core.documents import Document
from langchain_chroma import Chroma
import asyncio
from langchain_text_splitters import (
    Language,
    RecursiveCharacterTextSplitter,
)

from dotenv import load_dotenv
load_dotenv("apikey.env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GITHUB_API_KEY = os.getenv("GITHUB_API_KEY")

# Add splits to db 
async def add_to_vectordb(all_splits):
    Chroma.from_documents(documents=all_splits, embedding=OpenAIEmbeddings(model="text-embedding-ada-002"), persist_directory="./chroma_persist_dir")

# Add file, add to db
async def receive_file(files):
    python_splitter = RecursiveCharacterTextSplitter.from_language(language=Language.PYTHON, chunk_size=100, chunk_overlap=0)

    file_contents = [i.read().decode('utf-8') for key,i in files.items()]
    all_splits=[]

    for file_content in file_contents:
        splits = python_splitter.create_documents([file_content])
        [all_splits.extend([Document(page_content=i.page_content, metadata={"type":"file"}, id=i.id)]) for i in splits]
    await add_to_vectordb(all_splits)

# Add link, scrape & add to db
async def check_text_docs(doc_list):
    while len(doc_list[-1].page_content) > 500:
        i = doc_list.pop(-1)
        doc_list.extend([Document(page_content=i.page_content[:500], metadata={"type":"text"}, id=i.id), Document(page_content=i.page_content[500:], metadata={"type":"text"}, id=i.id)])

    if len(doc_list[-1].page_content) < 31: doc_list.pop(-1)
    return doc_list

async def receive_link(links):
    text_splitter = SemanticChunker(OpenAIEmbeddings(model="text-embedding-ada-002"), breakpoint_threshold_type="percentile", min_chunk_size=30)

    docs = []
    all_splits =[]
    for key, link in links.items():
        loader = UnstructuredLoader(web_url=link)
        
        async for doc in loader.alazy_load():
            docs.append(doc)
    
    for doc in docs:
        semantic_splits = text_splitter.create_documents([doc.page_content])
        for i in semantic_splits:
            splits = await check_text_docs([i])
            all_splits.extend(splits)

    await add_to_vectordb(all_splits)


# Retrieve relevant docs
async def retrieve(query):
    vectorstore = Chroma(embedding_function=OpenAIEmbeddings(model="text-embedding-ada-002"), persist_directory="./chroma_persist_dir")
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 3})
    retrieved_docs = retriever.invoke(query)
    return retrieved_docs
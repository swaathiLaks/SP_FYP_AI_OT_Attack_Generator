# Methods for main langchain pipeline are here
from langchain_openai.embeddings import OpenAIEmbeddings 
from langchain_chroma import Chroma
import asyncio

async def retrieve():
    vectorstore = Chroma(embedding_function=OpenAIEmbeddings(), persist_directory="chroma_persist_dir")
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 6})
    retrieved_docs = retriever.invoke("How to perform DDoS attack?")
    print(retrieved_docs)

# asyncio.run(retrieve())